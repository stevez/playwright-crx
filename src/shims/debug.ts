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
 * Shim for playwright-core/lib/server/utils/debug.
 *
 * Re-exports everything from the upstream module and adds setUnderTest()
 * which was removed in 1.55. The upstream isUnderTest() is now env-based
 * (PWTEST_UNDER_TEST), but Chrome Extension service workers don't have
 * process.env, so we need a runtime setter.
 */

export { debugMode } from '../../playwright/packages/playwright-core/src/server/utils/debug';

let _isUnderTest = false;

export function isUnderTest(): boolean {
  return _isUnderTest;
}

export function setUnderTest() {
  _isUnderTest = true;
}
