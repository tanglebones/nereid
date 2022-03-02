import assert from 'assert';
import {resolvedVoid, resolvedUndefined, resolvedTrue, resolvedFalse} from './resolved'

describe('resolvedPromise', () => {
  it('Resolves various values', () => {
    resolvedVoid.then(v => assert.strictEqual(v, undefined));
    resolvedUndefined.then(v => assert.strictEqual(v, undefined));
    resolvedTrue.then(v => assert.strictEqual(v, true));
    resolvedFalse.then(v => assert.strictEqual(v, false));
  });
});
