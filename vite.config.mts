/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import fs from 'fs';
import path from 'path';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import replace from '@rollup/plugin-replace';

const baseDir = __dirname.replace(/\\/g, '/');

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      // CRX shims for vendored playwright (must be before the general alias)
      // Note: javascript.ts CSP patch must stay in vendor (shim can't override internal function calls)
      // Stub pixelmatch (CJS module not used in CRX, causes ESM interop issues)
      [path.resolve(__dirname, './playwright/packages/playwright-core/src/third_party/pixelmatch')]: path.resolve(__dirname, './src/shims/pixelmatch'),

      'playwright-core/lib': path.resolve(__dirname, './playwright/packages/playwright-core/src'),
      '@playwright/test/lib': path.resolve(__dirname, './playwright/packages/playwright/src'),
      'playwright-core': path.resolve(__dirname, './src/index'),

      // playwright 1.60+ splits shared code into packages/* and imports it through these aliases
      '@isomorphic': path.resolve(__dirname, './playwright/packages/isomorphic'),
      '@utils': path.resolve(__dirname, './playwright/packages/utils'),
      '@injected': path.resolve(__dirname, './playwright/packages/injected/src'),
      '@protocol': path.resolve(__dirname, './playwright/packages/protocol/src'),
      '@recorder': path.resolve(__dirname, './playwright/packages/recorder/src'),
      '@testIsomorphic': path.resolve(__dirname, './playwright/packages/playwright/src/isomorphic'),
      '@trace': path.resolve(__dirname, './playwright/packages/trace/src'),
      '@web': path.resolve(__dirname, './playwright/packages/web/src'),

      // shims
      '_url': path.resolve(__dirname, './node_modules/url'),
      '_util': path.resolve(__dirname, './node_modules/util'),
      '_stack-utils': path.resolve(__dirname, './node_modules/stack-utils'),

      'async_hooks': path.resolve(__dirname, './src/shims/async_hooks'),
      'assert': path.resolve(__dirname, './node_modules/assert'),
      'buffer': path.resolve(__dirname, './node_modules/buffer'),
      'child_process': path.resolve(__dirname, './src/shims/child_process'),
      'chokidar': path.resolve(__dirname, './src/shims/chokidar'),
      'constants': path.resolve(__dirname, './node_modules/constants-browserify'),
      'crypto': path.resolve(__dirname, './node_modules/crypto-browserify'),
      'debug': path.resolve(__dirname, './node_modules/debug'),
      'dns': path.resolve(__dirname, './src/shims/dns'),
      'events': path.resolve(__dirname, './node_modules/events'),
      'fs': path.resolve(__dirname, './src/shims/fs'),
      'graceful-fs': path.resolve(__dirname, './src/shims/fs'),
      'http': path.resolve(__dirname, './node_modules/stream-http'),
      'http2': path.resolve(__dirname, './node_modules/stream-http'),
      'https': path.resolve(__dirname, './node_modules/https-browserify'),
      'inspector': path.resolve(__dirname, './src/shims/inspector'),
      'module': path.resolve(__dirname, './src/shims/module'),
      'net': path.resolve(__dirname, './src/shims/net'),
      'os': path.resolve(__dirname, './node_modules/os-browserify/browser'),
      'path': path.resolve(__dirname, './node_modules/path'),
      'process': path.resolve(__dirname, './node_modules/process'),
      'readline': path.resolve(__dirname, './src/shims/readline'),
      'setimmediate': path.resolve(__dirname, './node_modules/setimmediate'),
      'stream': path.resolve(__dirname, './node_modules/readable-stream'),
      'tls': path.resolve(__dirname, './src/shims/tls'),
      'url': path.resolve(__dirname, './src/shims/url'),
      'zlib': path.resolve(__dirname, './node_modules/browserify-zlib'),

      'fs/promises': path.resolve(__dirname, './src/shims/fs/promises'),

      'node:events': path.resolve(__dirname, './node_modules/events'),
      'node:module': path.resolve(__dirname, './src/shims/module'),
      'node:stream': path.resolve(__dirname, './node_modules/readable-stream'),
      'node:string_decoder': path.resolve(__dirname, './node_modules/string_decoder'),
    },
  },
  define: {
    'require.resolve': 'Boolean',
  },
  plugins: [
    // Stub modules not usable in Chrome extension service workers
    {
      name: 'stub-unsupported',
      enforce: 'pre',
      resolveId(source) {
        // playwright 1.60+ imports the MCP SDK directly instead of through mcpBundleImpl
        if (source.includes('mcpBundleImpl') || source.startsWith('@modelcontextprotocol/sdk'))
          return path.resolve(__dirname, './src/shims/mcpBundleImpl.ts');
        // playwright 1.62+ upgraded these to versions that import Node-only APIs (node:util, powershell-utils).
        // open launches a desktop browser and commander parses CLI args; neither runs in an extension.
        // proxy-agent-negotiate (Kerberos proxy auth, new in https-proxy-agent 9) lazily import()s kerberos,
        // and that dynamic import() keeps the service worker from restarting.
        if (source === 'open' || source === 'commander' || source === 'proxy-agent-negotiate')
          return `\0crx-stub:${source}`;
      },
      load(id) {
        const normalized = id.replace(/\\/g, '/');
        // Stub package.ts (playwright 1.60+): it require()s package.json from disk at load time,
        // which throws in a service worker. Only packageJSON.version is read, so inline it.
        if (/playwright\/packages\/(playwright-core|playwright)\/src\/package\.ts$/.test(normalized)) {
          const { version } = JSON.parse(fs.readFileSync(path.join(path.dirname(id), '..', 'package.json'), 'utf8'));
          return `export const packageRoot = ''; export const packageJSON = { version: ${JSON.stringify(version)} }; export const binPath = 'bin'; export function libPath(...parts) { return ['lib', ...parts].join('/'); }`;
        }
        // Stub browser.bind() servers (pipe / WebSocket, unusable in an extension). Importing the real ones
        // from server/browser.ts pulls in all of server/ and makes CRBrowser/BidiBrowser load before Browser.
        if (/playwright-core\/src\/remote\/playwright(PipeServer|WebSocketServer)\.ts$/.test(normalized)) {
          const name = normalized.includes('PipeServer') ? 'PlaywrightPipeServer' : 'PlaywrightWebSocketServer';
          return `export class ${name} { constructor() { throw new Error("browser.bind() is not available in CRX"); } }`;
        }
        if (id === '\0crx-stub:open')
          return 'export default async function open() { throw new Error("open() is not available in CRX"); }';
        if (id === '\0crx-stub:proxy-agent-negotiate')
          return 'export function createNegotiateAuth() { throw new Error("Negotiate proxy auth is not available in CRX"); }';
        if (id === '\0crx-stub:commander')
          return 'export class Command { constructor() { throw new Error("commander is not available in CRX"); } } export const program = {}; export class Option {}';
        // Stub pixelmatch (CJS module not used in CRX, alias doesn't resolve on cold cache)
        if (normalized.includes('third_party/pixelmatch'))
          return 'export default function() { throw new Error("pixelmatch not available in CRX"); }';
        // Stub MCP test runner imports
        if (normalized.includes('/mcp/') && normalized.includes('playwright/packages/playwright/'))
          return 'export default {}; export const runBrowserBackendAtEnd = () => {}; export const createCustomMessageHandler = () => {};';
        // Stub test runner globals (used by matchers.ts but not needed in CRX)
        if (normalized.includes('playwright/packages/playwright/src/common/globals'))
          return 'export const currentTestInfo = () => undefined;';
        // Stub test worker info (used by matchers.ts toPass)
        if (normalized.includes('playwright/packages/playwright/src/worker/testInfo'))
          return 'export class TestInfoImpl { static _defaultDeadlineForMatcher(t) { return { deadline: Date.now() + (t || 5000), timeoutMessage: "" }; } }';
        // Stub snapshot matchers (require test runner for snapshot paths)
        if (normalized.includes('playwright/packages/playwright/src/matchers/toMatchSnapshot'))
          return 'export const toMatchSnapshot = () => { throw new Error("toMatchSnapshot not available in CRX"); }; export const toHaveScreenshot = toMatchSnapshot; export const toHaveScreenshotStepTitle = () => "";';
        // Stub toMatchAriaSnapshot (reimplemented in crxExpect.ts via locator._expect)
        if (normalized.includes('playwright/packages/playwright/src/matchers/toMatchAriaSnapshot'))
          return 'export async function toMatchAriaSnapshot() { throw new Error("toMatchAriaSnapshot stub - should be overridden by crxExpect"); }';
      },
      transform(code, id) {
        const normalized = id.replace(/\\/g, '/');
        // playwright 1.60+ loads browsers.json through a dynamic path, which the bundler can't follow
        // and which throws at service worker startup; restore the static require from 1.59.
        if (normalized.endsWith('playwright-core/src/server/registry/index.ts'))
          return code.replace(`require(path.join(packageRoot, 'browsers.json'))`, `require('../../../browsers.json')`);
      },
    } as Plugin<any>,
    replace({
      'preventAssignment': true,
      '__dirname': id => {
        const relativePath = path.posix.relative(baseDir, path.posix.dirname(id));
        return [
          'src',
          'playwright/packages/playwright-core/src',
          'playwright/packages/playwright/src',
          'playwright/packages/utils',
          'playwright/packages/isomorphic',
        ].some(p => relativePath.startsWith(p)) ? JSON.stringify(relativePath) : '__dirname';
      },
    }) as Plugin<any>,
  ],
  build: {
    outDir: path.resolve(__dirname, './lib/'),
    assetsInlineLimit: 0,
    // skip code obfuscation
    minify: false,
    lib: {
      entry: {
        index: path.resolve(__dirname, 'src/index.ts'),
        test: path.resolve(__dirname, 'src/test.ts'),
      },
      formats: ['es'],
    },
    sourcemap: false,
    rollupOptions: {
      output: {
        exports: 'named',
      },
    },
    commonjsOptions: {
      transformMixedEsModules: true,
      extensions: ['.ts', '.js'],
      exclude: [
        path.resolve(__dirname, './playwright/packages/playwright/src/index.ts'),
        path.resolve(__dirname, './playwright/packages/playwright-core/src/cli/**/*.ts'),
        // prevent from resolving require('../playwright')
        path.resolve(__dirname, './playwright/packages/playwright-core/src/server/recorder/recorderApp.ts'),
        // prevent from resolving require('./bidiOverCdp')
        path.resolve(__dirname, './playwright/packages/playwright-core/src/server/bidi/bidiChromium.ts'),
      ],
      include: [
        path.resolve(__dirname, './playwright/packages/playwright/src/**/*'),
        path.resolve(__dirname, './playwright/packages/playwright-core/src/**/*'),
        path.resolve(__dirname, './playwright/packages/utils/**/*'),
        path.resolve(__dirname, './playwright/packages/isomorphic/**/*'),
        /node_modules/,
      ],
    }
  },
});
