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

/**
 * Monkey-patches the upstream Recorder class to expose internal members
 * and add CRX-specific methods. This avoids modifying vendored playwright
 * files, making subtree upgrades a clean pull.
 *
 * Patches applied:
 * 1. _context: expose as public (needed by CrxRecorderApp)
 * 2. _isRecording: expose as public (needed by CrxRecorderApp)
 * 3. clearErrors(): remove error call logs
 * 4. setOutput(): map codegen IDs to Language values
 * 5. loadScript(): no-op stub for CrxRecorderApp compatibility
 * 6. _uninstallInjectedRecorder(): uninstall injected recorder from page
 */

import { Recorder } from 'playwright-core/lib/server/recorder';
import type { Page } from 'playwright-core/lib/server/page';
import type { Language } from 'playwright-core/lib/utils';
import type * as actions from '@recorder/actions';

const codegenIdToLanguage: Record<string, Language> = {
  'playwright-test': 'javascript',
  'javascript': 'javascript',
  'python-pytest': 'python',
  'python': 'python',
  'python-async': 'python',
  'java-junit': 'java',
  'java': 'java',
  'csharp-mstest': 'csharp',
  'csharp-nunit': 'csharp',
  'csharp': 'csharp',
  'jsonl': 'jsonl',
};

// Use module augmentation to declare the patched members on the Recorder type.
declare module 'playwright-core/lib/server/recorder' {
  interface Recorder {
    _context: import('playwright-core/lib/server/browserContext').BrowserContext;
    _isRecording(): boolean;
    clearErrors(): void;
    setOutput(codegenId: string, outputFile: string | undefined): void;
    loadScript(script: { actions: actions.ActionInContext[], deviceName: string, contextOptions: any, text: string, highlight?: any[] }): void;
    _uninstallInjectedRecorder(page: Page): Promise<void>;
  }
}

const proto = Recorder.prototype as any;

// clearErrors - remove error call logs
proto.clearErrors = function(this: any) {
  const errors = [...this._currentCallsMetadata.keys()].filter((c: any) => c.error);
  for (const error of errors)
    this._currentCallsMetadata.delete(error);
  this._updateUserSources();
};

// setOutput - map codegen IDs to Language values and set _currentLanguage
proto.setOutput = function(this: any, codegenId: string, _outputFile: string | undefined) {
  this._currentLanguage = (codegenIdToLanguage[codegenId] ?? 'javascript') as Language;
};

// loadScript - no-op stub for CrxRecorderApp compatibility
proto.loadScript = function(this: any, _script: any) {
  // Source management is handled by CrxRecorderApp.
};

// _uninstallInjectedRecorder - uninstall injected recorder from page
proto._uninstallInjectedRecorder = async function(this: any, page: Page) {
  await Promise.all(page.frames().map(f => f.evaluateExpression('window.__pw_uninstall()').catch(() => {})));
};
