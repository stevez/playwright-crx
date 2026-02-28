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

import type { Crx, BrowserContext } from './src/types/types';

export * from './src/types/types';

export const crx: Crx;
export function _setUnderTest(): void;
export function _isUnderTest(): boolean;
export const _debug: {
  enable(namespaces: string): void;
  enabled(namespaces: string): boolean;
  disable(): void;
};

// MCP Browser Backend types

export interface McpToolAnnotations {
  title?: string;
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  openWorldHint?: boolean;
}

export interface McpTool {
  name: string;
  description?: string;
  inputSchema: {
    type: 'object';
    properties?: Record<string, unknown>;
    required?: string[];
    [key: string]: unknown;
  };
  annotations?: McpToolAnnotations;
}

export interface McpContentBlock {
  type: string;
  text?: string;
  data?: string;
  mimeType?: string;
  [key: string]: unknown;
}

export interface McpCallToolResult {
  content: McpContentBlock[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

export interface McpClientInfo {
  name: string;
  version: string;
  roots: Array<{ uri: string; name?: string }>;
  timestamp: number;
}

export interface McpBrowserContextFactory {
  createContext(clientInfo: McpClientInfo, abortSignal: AbortSignal, options: { toolName?: string }): Promise<{
    browserContext: BrowserContext;
    close: () => Promise<void>;
  }>;
}

export interface McpFullConfig {
  browser: {
    browserName: 'chromium' | 'firefox' | 'webkit';
    launchOptions: Record<string, unknown>;
    contextOptions: Record<string, unknown>;
    isolated: boolean;
    [key: string]: unknown;
  };
  console: {
    level: 'error' | 'warning' | 'info' | 'debug';
  };
  network: {
    allowedOrigins?: string[];
    blockedOrigins?: string[];
  };
  server: Record<string, unknown>;
  saveTrace: boolean;
  snapshot: {
    mode: 'incremental' | 'full' | 'none';
    output: 'stdout' | 'file';
  };
  timeouts: {
    action: number;
    navigation: number;
  };
  [key: string]: unknown;
}

export class BrowserServerBackend {
  constructor(config: McpFullConfig, factory: McpBrowserContextFactory, options?: { allTools?: boolean; structuredOutput?: boolean });
  initialize(clientInfo: McpClientInfo): Promise<void>;
  listTools(): Promise<McpTool[]>;
  callTool(name: string, args?: Record<string, unknown>): Promise<McpCallToolResult>;
  serverClosed(): void;
}

export function identityBrowserContextFactory(browserContext: BrowserContext): McpBrowserContextFactory;

export const defaultConfig: McpFullConfig;

// CLI Command Parser types

export interface AnyCommandSchema {
  name: string;
  category: string;
  description: string;
  hidden?: boolean;
  args?: { shape: Record<string, unknown> };
  options?: { shape: Record<string, unknown> };
  toolName: string | ((args: any) => string);
  toolParams: (args: any) => any;
}

export function parseCommand(
  command: AnyCommandSchema,
  args: { _: string[]; [key: string]: string | string[] }
): { toolName: string; toolParams: Record<string, unknown> };

export const commands: Record<string, AnyCommandSchema>;
