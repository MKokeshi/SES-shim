import test from 'tape';
import '../ses.js';

lockdown();

test('tame locale methods', t => {
  t.equal(Object.prototype.toString, Object.prototype.toLocaleString);
  t.equal(Number.prototype.toString, Number.prototype.toLocaleString);
  t.equal(BigInt.prototype.toString, BigInt.prototype.toLocaleString);
  t.equal(Date.prototype.toDateString, Date.prototype.toLocaleDateString);
  t.equal(Date.prototype.toString, Date.prototype.toLocaleString);
  t.equal(Date.prototype.toTimeString, Date.prototype.toLocaleTimeString);
  t.equal(String.prototype.toLowerCase, String.prototype.toLocaleLowerCase);
  t.equal(String.prototype.toUpperCase, String.prototype.toLocaleUpperCase);
  t.equal(Array.prototype.toString, Array.prototype.toLocaleString);

  const TypedArray = Reflect.getPrototypeOf(Uint8Array);
  t.equal(TypedArray.prototype.toString, TypedArray.prototype.toLocaleString);

  t.equal(typeof String.prototype.localeCompare, 'function');
  t.not(`${String.prototype.localeCompare}`.includes('[native code]'));

  t.end();
});
