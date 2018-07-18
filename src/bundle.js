
    export const creatorStrings = "(function (exports) {\n  'use strict';\n\n  // Adapted from SES/Caja - Copyright (C) 2011 Google Inc.\n  // https://github.com/google/caja/blob/master/src/com/google/caja/ses/startSES.js\n  // https://github.com/google/caja/blob/master/src/com/google/caja/ses/repairES5.js\n\n  // then copied from proposal-frozen-realms deep-freeze.js\n\n  function deepFreeze(primordialRoots) {\n\n    const { freeze, getOwnPropertyDescriptors, getPrototypeOf } = Object;\n    const { ownKeys } = Reflect;\n\n    // Objects that are deeply frozen.\n    const frozenSet = new WeakSet();\n\n    /**\n     * \"deepFreeze()\" acts like \"Object.freeze()\", except that:\n     *\n     * To deepFreeze an object is to freeze it and all objects transitively\n     * reachable from it via transitive reflective property and prototype\n     * traversal.\n     */\n    function deepFreeze(node) {\n      // Objects that we have frozen in this round.\n      const freezingSet = new Set();\n\n      // If val is something we should be freezing but aren't yet,\n      // add it to freezingSet.\n      function enqueue(val) {\n        if (Object(val) !== val) {\n          // ignore primitives\n          return;\n        }\n        const type = typeof val;\n        if (type !== 'object' && type !== 'function') {\n          // future proof: break until someone figures out what it should do\n          throw new TypeError(`Unexpected typeof: ${type}`);\n        }\n        if (frozenSet.has(val) || freezingSet.has(val)) {\n          // todo use uncurried form\n          // Ignore if already frozen or freezing\n          return;\n        }\n        freezingSet.add(val); // todo use uncurried form\n      }\n\n      function doFreeze(obj) {\n        // Immediately freeze the object to ensure reactive\n        // objects such as proxies won't add properties\n        // during traversal, before they get frozen.\n\n        // Object are verified before being enqueued,\n        // therefore this is a valid candidate.\n        // Throws if this fails (strict mode).\n        freeze(obj);\n\n        // we rely upon certain commitments of Object.freeze and proxies here\n\n        // get stable/immutable outbound links before a Proxy has a chance to do\n        // something sneaky.\n        const proto = getPrototypeOf(obj);\n        const descs = getOwnPropertyDescriptors(obj);\n        enqueue(proto);\n        ownKeys(descs).forEach(name => {\n          // todo uncurried form\n          // todo: getOwnPropertyDescriptors is guaranteed to return well-formed\n          // descriptors, but they still inherit from Object.prototype. If\n          // someone has poisoned Object.prototype to add 'value' or 'get'\n          // properties, then a simple 'if (\"value\" in desc)' or 'desc.value'\n          // test could be confused. We use hasOwnProperty to be sure about\n          // whether 'value' is present or not, which tells us for sure that this\n          // is a data property.\n          const desc = descs[name];\n          if ('value' in desc) {\n            // todo uncurried form\n            enqueue(desc.value);\n          } else {\n            enqueue(desc.get);\n            enqueue(desc.set);\n          }\n        });\n      }\n\n      function dequeue() {\n        // New values added before forEach() has finished will be visited.\n        freezingSet.forEach(doFreeze); // todo curried forEach\n      }\n\n      function commit() {\n        // todo curried forEach\n        // we capture the real WeakSet.prototype.add above, in case someone\n        // changes it. The two-argument form of forEach passes the second\n        // argument as the 'this' binding, so we add to the correct set.\n        freezingSet.forEach(frozenSet.add, frozenSet);\n      }\n\n      enqueue(node);\n      dequeue();\n      commit();\n    }\n\n    deepFreeze(primordialRoots);\n  }\n\n  // Copyright (C) 2011 Google Inc.\n\n  // Copyright (C) 2011 Google Inc.\n\n  function removeProperties(global) {\n\n    const uncurryThis = fn => (thisArg, ...args) => Reflect.apply(fn, thisArg, args);\n    const gopd = Object.getOwnPropertyDescriptor;\n    const gopn = Object.getOwnPropertyNames;\n    const cleaning = new WeakMap();\n    const getProto = Object.getPrototype;\n    const hop = uncurryThis(Object.prototype.hasOwnProperty);\n\n    const whiteTable = new WeakMap();\n\n\n    /**\n     * Should the property named {@code name} be whitelisted on the\n     * {@code base} object, and if so, with what Permit?\n     *\n     * <p>If it should be permitted, return the Permit (where Permit =\n     * true | \"maybeAccessor\" | \"*\" | Record(Permit)), all of which are\n     * truthy. If it should not be permitted, return false.\n     */\n    function getPermit(base, name) {\n      const permit = whiteTable.get(base);\n      if (permit) {\n        if (hop(permit, name)) { return permit[name]; }\n      }\n      while (true) {\n        base = getProto(base);\n        if (base === null) { return false; }\n        permit = whiteTable.get(base);\n        if (permit && hop(permit, name)) {\n          const result = permit[name];\n          if (result === '*') {\n            return result;\n          } else {\n            return false;\n          }\n        }\n      }\n    }\n\n    /**\n     * Removes all non-whitelisted properties found by recursively and\n     * reflectively walking own property chains.\n     *\n     * <p>Inherited properties are not checked, because we require that\n     * inherited-from objects are otherwise reachable by this traversal.\n     */\n    function clean(value, prefix) {\n      if (value !== Object(value)) { return; }\n      if (cleaning.get(value)) { return; }\n\n      const proto = getProto(value);\n      if (proto !== null && !whiteTable.has(proto)) {\n        //reportItemProblem(rootReports, ses.severities.NOT_ISOLATED,\n        //                  'unexpected intrinsic', prefix + '.__proto__');\n        throw new Error(`unexpected intrinsic ${prefix}.__proto__`);\n      }\n\n      cleaning.set(value, true);\n      gopn(value).forEach(function(name) {\n        const path = prefix + (prefix ? '.' : '') + name;\n        const p = getPermit(value, name);\n        if (p) {\n          const desc = gopd(value, name);\n          if (hop(desc, 'value')) {\n            // Is a data property\n            const subValue = desc.value;\n            clean(subValue, path);\n          } else {\n            if (p !== 'maybeAccessor') {\n              // We are not saying that it is safe for the prop to be\n              // unexpectedly an accessor; rather, it will be deleted\n              // and thus made safe.\n              //reportProperty(ses.severities.SAFE_SPEC_VIOLATION,\n              //               'Not a data property', path);\n              delete value[name];\n            } else {\n              clean(desc.get, path + '<getter>');\n              clean(desc.set, path + '<setter>');\n            }\n          }\n        } else {\n          delete value[name];\n        }\n      });\n    }\n    clean(global, '');\n\n  }\n\n  // todo: copy exact copies from es-lab startSES.js, commit, then edit down to\n  // what we've got here and put that into a second commit\n\n\n  function tameDate(global) {\n    const unsafeDate = global.Date;\n    // Date(anything) gives a string with the current time\n    // new Date(x) coerces x into a number and then returns a Date\n    // new Date() returns the current time, as a Date object\n    // new Date(undefined) returns a Date object which stringifies to 'Invalid Date'\n\n    function Date(...args) {\n      if (new.target === undefined) {\n        // we were not called as a constructor\n        // this would normally return a string with the current time\n        return 'Invalid Date';\n      }\n      // constructor behavior: if we get arguments, we can safely pass them through\n      if (args.length > 0) {\n        return Reflect.construct(unsafeDate, args, new.target);\n        // todo: make sure our constructor can still be subclassed\n      }\n      // no arguments: return a Date object, but invalid\n      return Reflect.construct(unsafeDate, [NaN], new.target);\n    }\n    Object.defineProperties(Date, Object.getOwnPropertyDescriptors(unsafeDate));\n    // that will copy the .prototype too, so this next line is unnecessary\n    //Date.prototype = unsafeDate.prototype;\n    unsafeDate.prototype.constructor = Date;\n    Date.now = () => NaN;\n    global.Date = Date;\n  }\n\n  function tameMath(global) {\n    //global.Math.random = () => 4; // https://www.xkcd.com/221\n    global.Math.random = () => NaN;\n  }\n\n  function tameIntl(global) {\n    // todo: somehow fix these. These almost certainly don't enable the reading\n    // of side-channels, but we want things to be deterministic across\n    // runtimes.\n    global.Intl.DateTimeFormat = () => 0;\n    global.Intl.NumberFormat = () => 0;\n    global.Intl.getCanonicalLocales = () => [];\n    global.Object.prototype.toLocaleString = () => {\n      throw new Error('toLocaleString suppressed');\n    };\n  }\n\n  function tameError(global) {\n    Object.defineProperty(global.Error.prototype, \"stack\",\n                          { get() { return 'stack suppressed'; } });\n  }\n\n  function tamePrimordials(global) {\n    tameDate(global);\n    tameMath(global);\n    tameIntl(global);\n    tameError(global);\n  }\n\n  function createSESWithRealmConstructor(creatorStrings, Realm) {\n    function makeSESRealm() {\n      const r = Realm.makeRootRealm();\n      r.global.SES = r.evaluate(creatorStrings).createSESInThisRealm(creatorStrings);\n      removeProperties(r.global);\n      tamePrimordials(r.global);\n      const primordialRoots = { global: r.global\n                                // todo: add other roots, to reach the\n                                // unreachables\n                              };\n      deepFreeze(primordialRoots);\n      return r;\n    }\n    const SES = {\n      makeSESRealm,\n      confine(code, endowments) {\n        const r = makeSESRealm();\n        return r.evaluate(code, endowments);\n      }\n    };\n\n    return SES;\n  }\n\n  function createSESInThisRealm(creatorStrings) {\n    return createSESWithRealmConstructor(creatorStrings, Realm);\n  }\n\n  exports.createSESWithRealmConstructor = createSESWithRealmConstructor;\n  exports.createSESInThisRealm = createSESInThisRealm;\n\n  return exports;\n\n}({}))";
