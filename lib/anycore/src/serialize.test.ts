import assert from 'assert';
import {deserialize, serialize} from './serialize';

describe('serialize', () => {
  it('serialize', () => {
    assert.strictEqual(serialize({a: 1}), '{"a":1}')
  });
  it('deserialize', () => {
    assert.deepStrictEqual(deserialize('{"a":1}'), {a: 1})
  });
  it('mismatched data & type', () => {
    const actual = deserialize<{ b: { c: string } }>('{"a":1}');
    // assert.deepStrictEqual(actual.b.c, undefined) // reports error.
    assert.deepStrictEqual(actual.b?.c, undefined) // defensive reads required.
  });
});
