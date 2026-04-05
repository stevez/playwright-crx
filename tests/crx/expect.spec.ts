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

import { test, expect } from './crxTest';

test('toBeVisible @smoke', async ({ runCrxTest, mockPaths }) => {
  await mockPaths({ '/expect.html': '<h1>Hello</h1>' });
  await runCrxTest(async ({ expect, page, server }) => {
    await page.goto(`${server.PREFIX}/expect.html`);
    await expect(page.locator('h1')).toBeVisible();
  });
});

test('toBeHidden', async ({ runCrxTest, mockPaths }) => {
  await mockPaths({ '/expect.html': '<h1 style="display:none">Hello</h1>' });
  await runCrxTest(async ({ expect, page, server }) => {
    await page.goto(`${server.PREFIX}/expect.html`);
    await expect(page.locator('h1')).toBeHidden();
  });
});

test('toContainText', async ({ runCrxTest, mockPaths }) => {
  await mockPaths({ '/expect.html': '<p>Hello World</p>' });
  await runCrxTest(async ({ expect, page, server }) => {
    await page.goto(`${server.PREFIX}/expect.html`);
    await expect(page.locator('p')).toContainText('Hello');
  });
});

test('toHaveText', async ({ runCrxTest, mockPaths }) => {
  await mockPaths({ '/expect.html': '<p>Hello World</p>' });
  await runCrxTest(async ({ expect, page, server }) => {
    await page.goto(`${server.PREFIX}/expect.html`);
    await expect(page.locator('p')).toHaveText('Hello World');
  });
});

test('toHaveAttribute', async ({ runCrxTest, mockPaths }) => {
  await mockPaths({ '/expect.html': '<a href="https://example.com">Link</a>' });
  await runCrxTest(async ({ expect, page, server }) => {
    await page.goto(`${server.PREFIX}/expect.html`);
    await expect(page.locator('a')).toHaveAttribute('href', 'https://example.com');
  });
});

test('toHaveClass', async ({ runCrxTest, mockPaths }) => {
  await mockPaths({ '/expect.html': '<div class="foo bar">Hello</div>' });
  await runCrxTest(async ({ expect, page, server }) => {
    await page.goto(`${server.PREFIX}/expect.html`);
    await expect(page.locator('div')).toHaveClass('foo bar');
  });
});

test('toBeChecked', async ({ runCrxTest, mockPaths }) => {
  await mockPaths({ '/expect.html': '<body><input type="checkbox" checked /></body>' });
  await runCrxTest(async ({ expect, page, server }) => {
    await page.goto(`${server.PREFIX}/expect.html`);
    await expect(page.locator('input')).toBeChecked();
  });
});

test('toBeEnabled', async ({ runCrxTest, mockPaths }) => {
  await mockPaths({ '/expect.html': '<button>Click</button>' });
  await runCrxTest(async ({ expect, page, server }) => {
    await page.goto(`${server.PREFIX}/expect.html`);
    await expect(page.locator('button')).toBeEnabled();
  });
});

test('toBeDisabled', async ({ runCrxTest, mockPaths }) => {
  await mockPaths({ '/expect.html': '<button disabled>Click</button>' });
  await runCrxTest(async ({ expect, page, server }) => {
    await page.goto(`${server.PREFIX}/expect.html`);
    await expect(page.locator('button')).toBeDisabled();
  });
});

test('toHaveValue', async ({ runCrxTest, mockPaths }) => {
  await mockPaths({ '/expect.html': '<body><input value="hello" /></body>' });
  await runCrxTest(async ({ expect, page, server }) => {
    await page.goto(`${server.PREFIX}/expect.html`);
    await expect(page.locator('input')).toHaveValue('hello');
  });
});

test('toHaveCount', async ({ runCrxTest, mockPaths }) => {
  await mockPaths({ '/expect.html': '<body><ul><li>A</li><li>B</li><li>C</li></ul></body>' });
  await runCrxTest(async ({ expect, page, server }) => {
    await page.goto(`${server.PREFIX}/expect.html`);
    await expect(page.locator('li')).toHaveCount(3);
  });
});

test('toHaveTitle', async ({ runCrxTest, mockPaths }) => {
  await mockPaths({ '/expect.html': '<title>Test Page</title><body>Hello</body>' });
  await runCrxTest(async ({ expect, page, server }) => {
    await page.goto(`${server.PREFIX}/expect.html`);
    await expect(page).toHaveTitle('Test Page');
  });
});

test('toHaveURL', async ({ runCrxTest, mockPaths }) => {
  await mockPaths({ '/expect.html': '<body>Hello</body>' });
  await runCrxTest(async ({ expect, page, server }) => {
    await page.goto(`${server.PREFIX}/expect.html`);
    await expect(page).toHaveURL(/expect\.html$/);
  });
});

test('not.toBeVisible', async ({ runCrxTest, mockPaths }) => {
  await mockPaths({ '/expect.html': '<h1 style="display:none">Hello</h1>' });
  await runCrxTest(async ({ expect, page, server }) => {
    await page.goto(`${server.PREFIX}/expect.html`);
    await expect(page.locator('h1')).not.toBeVisible();
  });
});

