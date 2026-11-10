# Changelog

## Unreleased

### Bug Fixes

- **Restore the main frame session fallback in `crPage.ts`**: the `frameId != targetId` fix from 0.15.2 was silently dropped by the Playwright 1.55 subtree pull, so 1.55 through 1.65 threw `Frame has been detached.` again when attaching to some existing tabs. It is back as a vendored patch.

### Build

- New `npm run check:patches` (run by `build:crx`) fails if a Playwright upgrade drops one of the vendored patches.
- The `Chrome DevTools` test project is opt-in via `CRX_DEVTOOLS=1`, so a plain `npm test` no longer waits on the debugger.

## 1.22.1

### Bug Fixes

- **`page.screencast` delivers frames at fractional display scaling** (#36): headed Chrome at non-integer scaling (e.g. 125% on Windows, or a browser zoom level) reports fractional frame sizes. Playwright's protocol validator rejected them and every frame was silently dropped, so `onFrame` never fired. The vendored `crPage.ts` now rounds `viewportWidth`/`viewportHeight` (a third CRX patch to re-check after Playwright upgrades).

### Tests

- New `tests/crx/screencast.spec.ts` runs a screencast with `--force-device-scale-factor=1.25`, using a new `extraArgs` option in `crxTest`.

## 1.22.0

### Breaking Changes

- **Upgrade to Playwright 1.64.1**: incremental upgrade from 1.59.1 through 1.60, 1.61, 1.62, 1.63 to 1.64.1 (#30–#34). The public `crx` / `CrxApplication` API is unchanged.
- **Requires Node.js 20+**: `engines.node` is now `>=20`, matching Playwright 1.64.

### Changes

- Moved imports to Playwright's new `packages/*` layout (`@isomorphic`, `@utils`, `@protocol`, `@injected`, `@recorder`, …), set up as Vite aliases.
- Recorder parser: actions use `pageGuid` (1.62) and carry `signals` on the action context (1.63).
- Detach/close hide highlights via `page.highlightController` (1.63).
- New Vite stubs for modules that don't work in a service worker:
  - `open`, `commander` and `proxy-agent-negotiate` (Kerberos). The Kerberos module's lazy `import()` chunk kept the extension service worker from restarting.
  - `package.ts` and `browser.bind()` servers.
- New shims:
  - `inspector`: the npm `inspector@0.5` package crashed the service worker at load.
  - `net.getDefaultAutoSelectFamilyAttemptTimeout`.
  - `process.versions.node` now reports Node 20, which Playwright 1.64 checks for at startup.
- Re-applied the vendored CRX patches (CSP `unsafe-eval` guard, internal `CrxApplication` metainfo) after each upgrade.

### Tests

- Test harness `@playwright/test` follows the vendored version (now 1.64.1, Chromium 156).
- Tracing tests updated for trace format v9 (`_file` resources, snapshot `phase`).
- Incognito fixture updated for Chromium 156's extensions page ("Allow in Incognito" is now a switch).

## 1.21.4

### Build

- **ESM only** — drop CJS build, ship only ESM. Reduces npm package from 37MB to 8.7MB unpacked (1.6MB compressed).
- **Disable sourcemaps** — set `sourcemap: false` in Vite build config.
- **Add `files` field** — explicit file list in package.json replaces `.npmignore`.
- **Remove `rollup-plugin-sourcemaps`** — no longer needed.

## 1.21.2

### Bug Fixes

- **Mark CrxApplication attach/detach as internal** — `attach`, `attachAll`, `detach`, and `detachAll` methods are now marked as `internal` in protocol metainfo, preventing them from appearing as failed actions in the Playwright Trace Viewer.

## 1.21.1

### Features

- **Playwright expect matchers** — `expect` from `playwright-crx/test` now includes all Playwright locator/page matchers (`toBeVisible`, `toContainText`, `toHaveURL`, `toHaveTitle`, etc.). Test runner dependencies are stubbed via Vite plugin.
- **14 new e2e tests** for expect matchers.

### Limitations

- `toPass`, `toMatchSnapshot`, `toHaveScreenshot`, `toMatchAriaSnapshot` are unavailable (require Playwright test runner context).

## 1.21.0

### Breaking Changes

- **Upgrade to Playwright 1.59.1** — Final step of incremental upgrade from 1.53 to 1.59.1.

### Changes

- Re-applied CSP `unsafe-eval` guard in vendored `javascript.ts`.
- Updated test and example package versions.

## 1.20.0

### Breaking Changes

- **Upgrade to Playwright 1.58.2** — All internal APIs updated to match Playwright 1.58 architecture.

### Changes

- Replaced full playwright test runner import with standalone `expect` in `test.ts` — eliminates DOM/Node dependencies from service worker bundle.
- Test extension bundle reduced from 9 MB to 6.6 MB.
- Added zod dependency for playwright-core agent tool schemas.
- Added `src/shims/mcpBundleImpl.ts` with real zod + MCP SDK stubs.
- Added `browserType.executablePath()` null guard for CRX.
- Replaced `toThrowError` with `toThrow` in tests (expect@30 compat).

## 1.19.0

### Breaking Changes

- **Upgrade to Playwright 1.57.0** — All internal APIs updated to match Playwright 1.57 architecture.

### Changes

- Removed `Accessibility` API references (removed upstream).
- Removed `_bidiChromium`/`_bidiFirefox` browser types from dispatcher and validator (removed upstream).
- Fixed `expect` CJS/ESM interop by forcing CJS entry via Vite alias.
- Added `browserType.executablePath()` null guard for CRX (no downloaded browser).
- Updated MCP stub for `createCustomMessageHandler`.

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
