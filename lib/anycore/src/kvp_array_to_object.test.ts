import assert from 'assert';
import {kvpArrayToObject} from './kvp_array_to_object';

describe('kvpArrayToObject', () => {
  it('basics', () => {
    const p: { in: [string, unknown][], out: Record<string, unknown> }[] = [
      {in: [], out: {}},
      {in: [['a', 1]], out: {a: 1}},
      {in: [['a', 1], ['b', 'c']], out: {a: 1, b: 'c'}},
    ];
    p.forEach(t => {
      assert.deepStrictEqual(kvpArrayToObject(t.in), t.out);
    });
  });
});
