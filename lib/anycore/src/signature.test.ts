import assert from 'assert';
import {signatureObjectKeys} from "./signature";

describe('signature', () => {
  it('Basics', () => {
    const registry = {} as Record<string, string>;

    registry['1'] = 'a';
    registry['2'] = 'b';

    const s12 = signatureObjectKeys(registry);
    assert.ok(s12);
    delete registry['1'];

    const s2 = signatureObjectKeys(registry);
    assert.notStrictEqual(s12, s2);
    registry['1'] = 'c';

    assert.strictEqual(s12, signatureObjectKeys(registry))
  });
});
