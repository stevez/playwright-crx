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

import EventEmitter from 'events';
import type { BrowserContext } from 'playwright-core/lib/server/browserContext';
import { Page } from 'playwright-core/lib/server/page';
import { isUnderTest, ManualPromise, serializeExpectedTextValues } from 'playwright-core/lib/utils';
import { buildFullSelector } from 'playwright-core/lib/server/recorder/recorderUtils';
import { toKeyboardModifiers } from 'playwright-core/lib/server/codegen/language';
import type { ActionInContextWithLocation, Location } from './parser';
import type { FrameDescription } from '@recorder/actions';
import { toClickOptions } from 'playwright-core/lib/server/recorder/recorderRunner';
import { parseAriaSnapshotUnsafe } from 'playwright-core/lib/utils/isomorphic/ariaSnapshot';
import { serverSideCallMetadata } from 'playwright-core/lib/server';
import { ProgressController } from 'playwright-core/lib/server/progress';
import type { Crx } from '../crx';
import type { InstrumentationListener } from 'playwright-core/lib/server/instrumentation';
import { yaml } from 'playwright-core/lib/utilsBundle';

class Stopped extends Error {}

export type PerformAction = ActionInContextWithLocation | {
  action: {
    name: 'pause';
  };
  frame: FrameDescription;
  location?: Location;
};

export default class CrxPlayer extends EventEmitter {

  private _crx: Crx;
  private _currAction?: PerformAction;
  private _stopping?: ManualPromise;
  private _pageAliases = new Map<Page, string>();
  private _pause?: Promise<void>;

  constructor(crx: Crx) {
    super();
    this._crx = crx;
  }

  async pause() {
    if (!this._pause) {
      const context = (await this._crx.get({ incognito: false }))!._context;
      const pauseAction = {
        action: { name: 'pause' },
        frame: { pageAlias: 'page', framePath: [] },
      } satisfies PerformAction;
      this._pause = this
          ._performAction(context, pauseAction)
          .finally(() => this._pause = undefined)
          .catch(() => {});
    }
    await this._pause;
  }

  async run(pageOrContext: Page | BrowserContext, actions: PerformAction[]) {
    if (this.isPlaying())
      return;

    let page: Page;
    let context: BrowserContext;

    if (pageOrContext instanceof Page) {
      page = pageOrContext;
      context = page.context();
    } else {
      context = pageOrContext;
      page = context.pages()[0] ?? await context.newPage(serverSideCallMetadata());
    }

    const crxApp = await this._crx.get({ incognito: false });
    const recorder = crxApp?._recorder();
    let instrumentationListener: InstrumentationListener | undefined;

    if (recorder && crxApp && crxApp._context !== context) {
      // we intercept incognito call logs and forward them into the recorder
      const instrumentationListener: InstrumentationListener = {
        onBeforeCall: recorder.onBeforeCall.bind(recorder),
        onBeforeInputAction: recorder.onBeforeInputAction.bind(recorder),
        onCallLog: recorder.onCallLog.bind(recorder),
        onAfterCall: recorder.onAfterCall.bind(recorder),
      };
      if (instrumentationListener)
        context.instrumentation.addListener(instrumentationListener, context);
    }

    // Only initialize page aliases if 'page' isn't already mapped.
    // When called per-action from the step/resume loop, we must preserve
    // aliases created by openPage actions in previous run() calls.
    if (!this._pageAliases.has(page)) {
      this._pageAliases.clear();
      this._pageAliases.set(page, 'page');
    }
    this.emit('start');

    try {
      for (const action of actions) {
        if (action.action.name === 'openPage' && action.frame.pageAlias === 'page')
          continue;
        this._currAction = action;
        await this._performAction(context, action);
      }
    } catch (e) {
      if (e instanceof Stopped)
        return;
      throw e;
    } finally {
      this._currAction = undefined;
      if (instrumentationListener)
        context.instrumentation.removeListener(instrumentationListener);
    }
  }

  isPlaying() {
    return !!this._currAction;
  }

  resetPageAliases() {
    this._pageAliases.clear();
  }

  async stop() {
    if (this._currAction || this._pause) {
      this._currAction = undefined;
      this._stopping = new ManualPromise();
      await Promise.all([
        this._stopping,
        this._pause,
      ]);
      this._stopping = undefined;
      this._pause = undefined;
      this.emit('stop');
    }
  }

  // Adapted from upstream recorderRunner.ts to use ProgressController
  private async _performAction(browserContext: BrowserContext, actionInContext: PerformAction) {
    this._checkStopped();

    const kActionTimeout = isUnderTest() ? 2000 : 5000;
    const { action } = actionInContext;
    const pageAliases = this._pageAliases;
    const context = browserContext;

    if (action.name === 'pause')
      return;

    if (action.name === 'openPage') {
      const pageAlias = actionInContext.frame.pageAlias;
      if ([...pageAliases.values()].includes(pageAlias))
        throw new Error(`Page with alias ${pageAlias} already exists`);
      const callMetadata = serverSideCallMetadata();
      const controller = new ProgressController(callMetadata, context);
      const newPage = await controller.run(progress => context.newPage(progress, false), kActionTimeout);
      if (action.url && action.url !== 'about:blank' && action.url !== 'chrome://newtab/') {
        const navController = new ProgressController(serverSideCallMetadata(), newPage.mainFrame());
        await navController.run(progress => newPage.mainFrame().goto(progress, action.url), kActionTimeout);
      }
      pageAliases.set(newPage, pageAlias);
      return;
    }

    const pageAlias = actionInContext.frame.pageAlias;
    const page = [...pageAliases.entries()].find(([, alias]) => pageAlias === alias)?.[0];
    if (!page)
      throw new Error('Internal error: page not found');
    const mainFrame = page.mainFrame();

    if (action.name === 'closePage') {
      pageAliases.delete(page);
      await page.close({ runBeforeUnload: true });
      return;
    }

    const controller = new ProgressController(serverSideCallMetadata(), mainFrame);
    await controller.run(async progress => {
      this._checkStopped();
      if (action.name === 'navigate')
        return await mainFrame.goto(progress, action.url);
      const selector = buildFullSelector(actionInContext.frame.framePath, action.selector);
      if (action.name === 'click')
        return await mainFrame.click(progress, selector, { ...toClickOptions(action), strict: true });
      if (action.name === 'press') {
        const shortcut = [...toKeyboardModifiers(action.modifiers), action.key].join('+');
        return await mainFrame.press(progress, selector, shortcut, { strict: true });
      }
      if (action.name === 'fill')
        return await mainFrame.fill(progress, selector, action.text, { strict: true });
      if (action.name === 'setInputFiles')
        throw new Error('player does not support setInputFiles yet');
      if (action.name === 'check')
        return await mainFrame.check(progress, selector, { strict: true });
      if (action.name === 'uncheck')
        return await mainFrame.uncheck(progress, selector, { strict: true });
      if (action.name === 'select')
        return await mainFrame.selectOption(progress, selector, [], action.options.map((value: any) => ({ value })), { strict: true });
      // mainFrame.expect returns { matches } without throwing on failure,
      // so we need to check the result and throw to signal error to _run().
      const expectAndCheck = async (opts: Parameters<typeof mainFrame.expect>[2]) => {
        const result = await mainFrame.expect(progress, selector, opts);
        if (result.matches === opts.isNot)
          throw new Error(`Expect failed`);
        return result;
      };
      if (action.name === 'assertChecked')
        return await expectAndCheck({ selector, expression: 'to.be.checked', expectedValue: undefined, isNot: !action.checked });
      if (action.name === 'assertText')
        return await expectAndCheck({ selector, expression: 'to.have.text', expectedText: serializeExpectedTextValues([action.text], { matchSubstring: true, normalizeWhiteSpace: true }), isNot: false });
      if (action.name === 'assertValue')
        return await expectAndCheck({ selector, expression: 'to.have.value', expectedText: serializeExpectedTextValues([action.value], { matchSubstring: false, normalizeWhiteSpace: true }), isNot: false });
      if (action.name === 'assertVisible')
        return await expectAndCheck({ selector, expression: 'to.be.visible', isNot: false });
      if (action.name === 'assertSnapshot')
        return await expectAndCheck({ selector, expression: 'to.match.aria', expectedValue: parseAriaSnapshotUnsafe(yaml, action.ariaSnapshot), isNot: false });
      throw new Error('Internal error: unexpected action ' + (action as any).name);
    }, kActionTimeout);
  }

  private _checkStopped() {
    if (this._stopping) {
      this._stopping.resolve();
      throw new Stopped();
    }
  }
}
