/**
 * Copyright (c) Rui Figueira.
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

// Fails if a `git subtree pull` dropped one of our patches to the vendored playwright source.
// Keep in sync with "Fork patches" in README.md.

const fs = require('fs');
const path = require('path');

const patches = [
  {
    name: 'CSP unsafe-eval guard',
    file: 'packages/playwright-core/src/server/javascript.ts',
    marker: `patch(playwright-crx): check if CSP doesn't allow 'unsafe-eval'`,
  },
  {
    name: 'CrxApplication metainfo',
    file: 'packages/isomorphic/protocolMetainfo.ts',
    marker: `['CrxApplication.attach', { internal: true, }]`,
  },
  {
    name: 'screencast frame-size rounding',
    file: 'packages/playwright-core/src/server/chromium/crPage.ts',
    marker: 'viewportWidth: Math.round(payload.metadata.deviceWidth)',
  },
  {
    name: 'main frame session fallback',
    file: 'packages/playwright-core/src/server/chromium/crPage.ts',
    marker: 'patch(playwright-crx): the main frame id can differ from targetId',
  },
];

const root = path.join(__dirname, '..', 'playwright');
const missing = patches.filter(({ file, marker }) => !fs.readFileSync(path.join(root, file), 'utf8').includes(marker));

if (missing.length) {
  console.error('Vendored playwright patches missing (re-apply them, see "Fork patches" in README.md):');
  for (const { name, file } of missing)
    console.error(`  - ${name}: playwright/${file}`);
  process.exit(1);
}
console.log(`All ${patches.length} vendored playwright patches present.`);
