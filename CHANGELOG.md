# Changelog

## 1.18.0

### Breaking Changes

- **Upgrade to Playwright 1.56.1** — All internal APIs updated to match Playwright 1.56 architecture.

### Changes

- Re-applied CSP `unsafe-eval` guard in vendored `javascript.ts`.
- Added Vite `stub-mcp` plugin to short-circuit MCP module loading (new in 1.56, not used in CRX).

## 1.17.1

### Breaking Changes

- **Removed recorder app, player, and related tests** — The recorder UI (`crxRecorderApp`), step/resume player (`crxPlayer`), and recorder example extension have been removed. These depended on Recorder internals that changed between playwright versions, making upgrades painful. The parser (`parse()`, `parseForTest()`) is retained as a standalone utility. ~4,500 lines removed, 77 tests remain.

## 1.17.0

### Breaking Changes

- **Upgrade to Playwright 1.55.1** — All internal APIs updated to match Playwright 1.55 architecture.
- **Recorder/player tests excluded from CI** — Recorder popup initialization changed in 1.55; recorder and player tests are excluded pending fix.

### Changes

- `tNumber` replaced with `tInt`/`tFloat` in protocol validator.
- `serverSideCallMetadata` removed — uses `ProgressController()` defaults.
- `setUnderTest` restored via `src/shims/debug.ts` for extension service worker compatibility.
- `_toImpl` restored on `ChannelOwner.prototype` (removed upstream in 1.55).
- CSP `unsafe-eval` guard restored in vendored `javascript.ts` for MV3 extension compat.
- Removed `isPrimary`/`timestamp` from `Source`, `playing` from `CallMetadata`, `message` from `SourceHighlight` (removed upstream).
- Removed `onEditedCode`/`onCursorActivity` props from recorder example (removed upstream).

## 1.16.1

### Improvements

- **Extract CRX patches from vendored playwright** — Moved all inline patches out of `playwright/` vendor folder into `src/`. Recorder patches are now applied via monkey-patching (`src/server/crxRecorderPatches.ts`), and the CSP unsafe-eval guard uses a Vite alias shim (`src/shims/javascript.ts`). Future playwright subtree upgrades are now a clean pull with no patch conflicts.

## 1.16.0

### Breaking Changes

- **Upgrade to Playwright 1.54.2** — All internal APIs updated to match Playwright 1.54 architecture.

### Features

- **Recorder event handling rewrite** — Mirrors upstream `RecorderApp._handleUIEvent` for bidirectional communication (setMode, step, resume, pause, fileChanged, highlightRequested, clear).
- **Step-by-step player execution** — CRX player now supports pause-before-execute step semantics with source line highlighting, call log tracking, and debugger muting.
- **Aria snapshot assertion recording** — Full support for `toMatchAriaSnapshot` code generation, parsing, and playback.

### Bug Fixes

- **fix: migrate CrxPlayer to ProgressController** — Frame methods in 1.54 require `Progress` instead of `CallMetadata`. Rewrote player to use `ProgressController` and call recorder `onBeforeCall`/`onAfterCall` directly (bypassing debugger).
- **fix: add `assertingSnapshot` to protocol validator** — Missing mode enum value caused silent `ValidationError` preventing assertSnapshot mode from reaching the UI.
- **fix: `params.file` to `params.fileId`** — The `fileChanged` event parameter was renamed in the 1.54 recorder UI.
- **fix: `action.snapshot` to `action.ariaSnapshot`** — Field renamed in 1.54 action types.
- **fix: `assertValue` player to use `expectedText`** — `frame.expect` requires `expectedText` for `to.have.value` matcher, not `expectedValue`.
- **fix: recorder example vite alias** — Alias `playwright-crx` to local `lib/` so the example extension uses the workspace build instead of the published npm version.
- **fix: `_getActions` for non-playwright-test languages** — Was returning empty array because `_sources` was never populated; now falls back to `_recorderSources`.
- **fix: remove `PausedStateChanged` and `CallLogsUpdated` listeners** — These recorder events were overriding CRX's independently managed paused state and call logs.
- **fix: player `this.pause()` deadlock** — Removed blocking `pause()` call from player's `finally` block that caused debugger deadlock.

## 0.15.3

### Features

- **feat: add `extendInjectedScript` public API** — Exposes `BrowserContext.extendInjectedScript` through the client API, enabling extensions to inject custom code into the utility world alongside Playwright's `InjectedScript`. This gives synchronous access to `generateSelectorSimple()`, `asLocator()`, ARIA APIs, and other internal functionality. Auto-installs on new pages and navigations.

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
