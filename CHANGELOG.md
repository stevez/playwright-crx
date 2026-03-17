# Changelog

## 0.15.2

### Bug Fixes

- **fix: handle frameId != targetId when attaching to existing tabs** — When using `chrome.debugger.attach` to connect to an existing tab, Chrome can assign a main frame ID that differs from the target ID. Playwright's `_sessionForFrame` assumed these were always equal, causing "Frame has been detached" errors. The fix falls back to the main frame session stored under `targetId` when the frame walk reaches the root without finding a matching session.

- **fix: graceful detach for broken pages** — `_doDetach` now handles pages whose initialization failed (e.g., frame detached during attach). Instead of throwing, it detaches the transport directly so `close()` can still succeed and clear the singleton.

- **fix: allow restart after close** — `crx.start()` now checks whether the existing `CrxApplication` has been closed before throwing "already started", allowing a fresh start after the previous instance was closed.

## 0.15.1

- Include `protocol.d.ts` and `structs.d.ts` in npm package.
- Rename to `@playwright-repl/playwright-crx`.

## 0.15.0

- Initial release under `@playwright-repl` scope, forked from [playwright-crx](https://github.com/nicolo-ribaudo/playwright-crx).
