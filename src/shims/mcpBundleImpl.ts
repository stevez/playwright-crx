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
 * Shim for mcpBundleImpl — provides real zod (used by agent/tool schemas)
 * but stubs MCP SDK classes (require Node crypto, can't run in extensions).
 */
export { z } from 'zod';
export { zodToJsonSchema } from 'zod-to-json-schema';

// MCP SDK stubs — these require Node.js crypto and can't run in extensions
export const Client = undefined;
export const Server = undefined;
export const SSEClientTransport = undefined;
export const SSEServerTransport = undefined;
export const StdioClientTransport = undefined;
export const StdioServerTransport = undefined;
export const StreamableHTTPClientTransport = undefined;
export const StreamableHTTPServerTransport = undefined;
export const CallToolRequestSchema = undefined;
export const ListRootsRequestSchema = undefined;
export const ListToolsRequestSchema = undefined;
export const PingRequestSchema = undefined;
export const ProgressNotificationSchema = undefined;
export const Loop = undefined;
