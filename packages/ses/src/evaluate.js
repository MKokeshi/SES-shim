// Portions adapted from V8 - Copyright 2016 the V8 project authors.
// https://github.com/v8/v8/blob/master/src/builtins/builtins-function.cc

import { throwTantrum } from './assertions.js';
import { apply, immutableObject, proxyRevocable } from './commons.js';
import { getScopeConstants } from './scope-constants.js';
import { createScopeHandler } from './scope-handler.js';
import { applyTransforms, mandatoryTransforms } from './transforms.js';
import { makeEvaluateFactory } from './make-evaluate-factory.js';

/**
 * performEval()
 * The low-level operation used by all evaluators:
 * eval(), Function(), Evalutator.prototype.evaluate().
 */
export function performEval(
  source,
  globalObject,
  localObject = {},
  {
    localTransforms = [],
    globalTransforms = [],
    sloppyGlobalsMode = false,
  } = {},
) {
  // Execute the mandatory transforms last to ensure that any rewritten code
  // meets those mandatory requirements.
  source = applyTransforms(source, [
    ...localTransforms,
    ...globalTransforms,
    mandatoryTransforms,
  ]);

  const scopeHandler = createScopeHandler(globalObject, localObject, {
    sloppyGlobalsMode,
  });
  const scopeProxyRevocable = proxyRevocable(immutableObject, scopeHandler);
  // Ensure that "this" resolves to the scope proxy.

  const constants = getScopeConstants(globalObject, localObject);
  const evaluateFactory = makeEvaluateFactory(constants);
  const evaluate = apply(evaluateFactory, scopeProxyRevocable.proxy, []);

  scopeHandler.useUnsafeEvaluator = true;
  let err;
  try {
    // Ensure that "this" resolves to the safe global.
    return apply(evaluate, globalObject, [source]);
  } catch (e) {
    // stash the child-code error in hopes of debugging the internal failure
    err = e;
    throw e;
  } finally {
    if (scopeHandler.useUnsafeEvaluator === true) {
      // The proxy switches off useUnsafeEvaluator immediately after
      // the first access, but if that's not the case we abort.
      throwTantrum('handler did not revoke useUnsafeEvaluator', err);
      // If we were not able to abort, at least prevent further
      // variable resolution via the scopeHandler.
      scopeProxyRevocable.revoke();
    }
  }
}
