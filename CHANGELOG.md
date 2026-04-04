# Changelog

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
