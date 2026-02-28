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

// Partial MCP bundle for Chrome extension environment.
// Only zod is needed for BrowserServerBackend (schema parsing & JSON schema generation).
// MCP SDK transports (Server, Client, Stdio, etc.) are not supported in service workers.
export * as z from 'zod';
export { zodToJsonSchema } from 'zod-to-json-schema';
