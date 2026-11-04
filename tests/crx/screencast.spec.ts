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

// At non-integer display scaling (e.g. 125% on Windows) Chrome reports fractional
// screencast frame sizes; frames must still reach onFrame with integer sizes.
test.use({ extraArgs: ['--force-device-scale-factor=1.25'] });

test('should deliver screencast frames at fractional device scale factor', async ({ runCrxTest }) => {
  const frames = await runCrxTest(async ({ crxApp }) => {
    const page = await crxApp.newPage();
    await page.setContent('<button>Click</button><p id="out"></p>');
    const frames: { width: number, height: number, timestamp: number }[] = [];
    await page.screencast.start({
      onFrame: ({ viewportWidth, viewportHeight, timestamp }) => {
        frames.push({ width: viewportWidth, height: viewportHeight, timestamp });
      },
    });
    for (let i = 0; i < 5; i++) {
      await page.evaluate(i => document.querySelector('#out')!.textContent = `frame ${i}`, i);
      await page.waitForTimeout(100);
    }
    await page.screencast.stop();
    return frames;
  });

  expect(frames.length).toBeGreaterThan(0);
  for (const frame of frames) {
    expect(Number.isInteger(frame.width)).toBe(true);
    expect(Number.isInteger(frame.height)).toBe(true);
    expect(frame.timestamp).toBeGreaterThan(0);
  }
});
