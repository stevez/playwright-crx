# Playwright CRX

> **Fork notice:** This is a fork of [ruifigueira/playwright-crx](https://github.com/ruifigueira/playwright-crx) by Rui Figueira, published as [`@playwright-repl/playwright-crx`](https://www.npmjs.com/package/@playwright-repl/playwright-crx) for use with [playwright-repl](https://github.com/stevez/playwright-repl). It follows newer Playwright releases than upstream and carries the patches listed under [Fork patches](#fork-patches). See [CHANGELOG.md](./CHANGELOG.md) for details.

This package contains the [Chrome Extensions](https://developer.chrome.com/docs/extensions/) flavor of the [Playwright](http://github.com/microsoft/playwright) library.

For that, it relies on [`chrome.debugger`](https://developer.chrome.com/docs/extensions/reference/debugger/) to implement [playwright's `ConnectionTransport`](https://github.com/microsoft/playwright/blob/f8a30fb726bc35d4058a2d010b2ed5f6ca2409a3/packages/playwright-core/src/server/transport.ts#L54) interface.

**NOTE:** If you want to write end-to-end tests, you should use [@playwright/test](https://playwright.dev/docs/intro) instead.

## Requirements

- Node.js 20+
- Bundles Playwright **1.65.0** (Chromium-based browsers only)

## Install

```bash
npm install @playwright-repl/playwright-crx
```

The package is ESM only.

## API

It's possible to use `playwright-crx` as a library to create new chrome extensions.

Here's a simple example of a background service worker for a chrome extension using **playwright-crx**:

```ts
import { crx, expect } from '@playwright-repl/playwright-crx/test';

// if you don't need assertions, you can reduce the bundle size by importing crx from the main entry
// import { crx } from '@playwright-repl/playwright-crx';

chrome.action.onClicked.addListener(async ({ id: tabId }) => {
  const crxApp = await crx.start({ slowMo: 500 });

  try {
    // tries to connect to the active tab, or creates a new one
    const page = await crxApp.attach(tabId!).catch(() => crxApp.newPage());

    await page.goto('https://demo.playwright.dev/todomvc/#/');
    await page.getByPlaceholder('What needs to be done?').click();
    await page.getByPlaceholder('What needs to be done?').fill('Hello World!');
    await page.getByPlaceholder('What needs to be done?').press('Enter');

    // assertions work too
    await expect(page.getByTestId('todo-title')).toHaveText('Hello World!');
  } finally {
    // page stays open, but no longer controlled by playwright
    await crxApp.detach(page);
    // releases chrome.debugger
    await crxApp.close();
  }
});
```

A more complete example can be found in `examples/todomvc-crx`.

### Tracing

Playwright CRX also supports [tracing](https://playwright.dev/docs/api/class-tracing), compatible with [Playwright Trace Viewer](https://trace.playwright.dev).

Here's an example on how to run it:

```ts
await page.context().tracing.start({ screenshots: true, snapshots: true });

await page.goto('https://demo.playwright.dev/todomvc');
const newTodo = page.getByPlaceholder('What needs to be done?');
await newTodo.fill('buy some cheese');
await newTodo.press('Enter');
await expect(page.getByTestId('todo-title')).toHaveText('buy some cheese');

// stores in memfs and then reads its data
await page.context().tracing.stop({ path: '/tmp/trace.zip' });
const data = crx.fs.readFileSync('/tmp/trace.zip');

// opens playwright traceviewer
const tracePage = await crxApp.newPage();
await tracePage.goto('https://trace.playwright.dev');
const [filechooser] = await Promise.all([
  tracePage.waitForEvent('filechooser'),
  tracePage.getByRole('button', { name: 'Select file(s)' }).click(),
]);

// uploads the trace data buffer (file paths from memfs are not supported)
await filechooser.setFiles({
  name: 'trace.zip',
  mimeType: 'application/zip',
  buffer: Buffer.from(data),
});
```

You can give it a try with `examples/todomvc-crx`.

### Recorder

Upstream also ships a recorder / player Chrome extension built on this library. This fork doesn't include it; see [ruifigueira/playwright-crx](https://github.com/ruifigueira/playwright-crx) if you need it.

## Fork patches

Changes to the vendored Playwright source in `playwright/`, which must be re-checked after every Playwright upgrade:

- **CSP `unsafe-eval` guard** (`packages/playwright-core/src/server/javascript.ts`): skips the function serialization check when CSP blocks `unsafe-eval`, as it does in MV3 extension service workers.
- **`CrxApplication` metainfo** (`packages/isomorphic/protocolMetainfo.ts`): marks `attach`, `attachAll`, `detach` and `detachAll` as internal, so they don't show up as failed actions in the Trace Viewer.
- **Screencast frame-size rounding** (`packages/playwright-core/src/server/chromium/crPage.ts`, #36): rounds fractional viewport sizes so screencast frames aren't dropped at non-integer display scaling.

Changes in this package's own source (`src/`):

- **Graceful detach**: detaching a page whose initialization failed no longer throws, so `close()` still releases `chrome.debugger`.
- **Restart after close**: `crx.start()` works again after `crxApp.close()`.

## Build

To build `playwright-crx`:

```bash
npm ci
npm run build
```

## Tests

```bash
npm run test:install
npm test
```

Tests run in a headed Chromium with the `tests/test-extension` extension loaded. Set `HEADLESS=1` to run headless. To debug the extension's service worker, see [CONTRIBUTING.md](./CONTRIBUTING.md#debug).

## Updating Playwright

Playwright is vendored as a git subtree in `playwright/`. Upgrade one minor version at a time, on its own branch (replace `v1.65.0` with the desired release tag):

```bash
git subtree pull --prefix=playwright https://github.com/microsoft/playwright.git v1.65.0 --squash
```

Then:

1. **Check the vendored patches.** The squashed commit message ends with `git-subtree-split: <sha>`, the upstream commit that was pulled. Compare it with the vendored tree:

   ```bash
   git diff <split sha> HEAD:playwright --stat
   ```

   The only files listed should be the ones under [Fork patches](#fork-patches). If one is missing, the pull dropped that patch: re-apply it.
2. **Bump the test harness.** Set `@playwright/test` in `tests/package.json` to the same version, so the tests run against the same Chromium.
3. **Merge the PR with a merge commit.** Never squash or rebase a subtree PR: `git subtree` needs the original squashed commit and its `git-subtree-split` line to find the base for the next pull.

## Release

Releases are published by hand:

1. Bump `version` in `package.json` (and `package-lock.json`, e.g. with `npm version <x.y.z> --no-git-tag-version`).
2. Add a section for the version to [CHANGELOG.md](./CHANGELOG.md).
3. Merge to `main`, then tag it: `git tag v<x.y.z> && git push origin v<x.y.z>`.
4. Create a GitHub release for the tag, using the CHANGELOG section as notes.
5. Publish to npm from a clean build:

   ```bash
   npm ci
   npm run build
   npm publish
   ```
