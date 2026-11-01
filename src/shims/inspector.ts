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
 * Shim for node:inspector.
 *
 * playwright 1.62+ calls inspector.url() in client/page.ts to detect an attached JS debugger.
 * There is no Node inspector in an extension service worker, so report none attached.
 */

export function url(): string | undefined {
  return undefined;
}

export class Session {
  constructor() {
    throw new Error('inspector.Session is not available in CRX');
  }
}

export default { url, Session };
