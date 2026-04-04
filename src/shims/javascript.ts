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
 * Shim for playwright-core/lib/server/javascript.
 *
 * Re-exports everything from the upstream module and overrides
 * normalizeEvaluationExpression to restore the CSP (unsafe-eval)
 * guard needed for Chrome Extension MV3 service workers.
 *
 * In MV3, `new Function()` throws an EvalError due to CSP restrictions.
 * Upstream removed the guard in 1.55, but extensions still need it.
 */

// Import from the actual file path (not the alias) to avoid circular reference.
// The vite alias maps 'playwright-core/lib/server/javascript' → this shim,
// so we must use the relative path to the real file.
export {
  ExecutionContext,
  JSHandle,
  evaluate,
  evaluateExpression,
  parseUnserializableValue,
  JavaScriptErrorInEvaluate,
  isJavaScriptErrorInEvaluate,
  sparseArrayToString,
} from '../../playwright/packages/playwright-core/src/server/javascript';

export type {
  Func0,
  Func1,
  FuncOn,
  SmartHandle,
  ExecutionContextDelegate,
} from '../../playwright/packages/playwright-core/src/server/javascript';

export function normalizeEvaluationExpression(expression: string, isFunction: boolean | undefined): string {
  expression = expression.trim();

  if (isFunction) {
    try {
      new Function('(' + expression + ')');
    } catch (e1) {
      // Check if CSP doesn't allow 'unsafe-eval' (e.g. Chrome Extension MV3).
      // In that case, we can't validate the expression, so just pass it through.
      if (!(e1 instanceof EvalError) || !e1.message.includes('unsafe-eval')) {
        // This means we might have a function shorthand. Try another
        // time prefixing 'function '.
        if (expression.startsWith('async '))
          expression = 'async function ' + expression.substring('async '.length);
        else
          expression = 'function ' + expression;
        try {
          new Function('(' + expression  + ')');
        } catch (e2) {
          // We tried hard to serialize, but there's a weird beast here.
          throw new Error('Passed function is not well-serializable!');
        }
      }
    }
  }

  if (/^(async)?\s*function(\s|\()/.test(expression))
    expression = '(' + expression + ')';
  return expression;
}
