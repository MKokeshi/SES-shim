import test from "tape";
import sinon from "sinon";
import sandboxFunctionConstructors from "./sandboxFunctionConstructors";

/* eslint-disable no-proto, no-empty-function */

test("sandboxFunctionConstructors", t => {
  t.plan(8);

  function F() {}
  async function AF() {}
  function* G() {}
  async function* AG() {}

  const descs = {
    F: Object.getOwnPropertyDescriptor(F.__proto__, "constructor"),
    AF: Object.getOwnPropertyDescriptor(AF.__proto__, "constructor"),
    G: Object.getOwnPropertyDescriptor(G.__proto__, "constructor"),
    AG: Object.getOwnPropertyDescriptor(AG.__proto__, "constructor")
  };

  const sandbox = sinon.createSandbox();
  sandboxFunctionConstructors(sandbox);

  t.notEqual(descs.F.value, F.__proto__.constructor);
  t.notEqual(descs.AF.value, AF.__proto__.constructor);
  t.notEqual(descs.G.value, G.__proto__.constructor);
  t.notEqual(descs.AG.value, AG.__proto__.constructor);

  sandbox.restore();

  t.equal(descs.F.value, F.__proto__.constructor);
  t.equal(descs.AF.value, AF.__proto__.constructor);
  t.equal(descs.G.value, G.__proto__.constructor);
  t.equal(descs.AG.value, AG.__proto__.constructor);
});

/* eslint-enable no-proto, no-empty-function */
