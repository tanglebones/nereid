import assert from 'assert';
import {toUrlParam} from './to_url_param';

describe('toUrlParam', () => {
  it('basics', () => {
    const p: { in: [string, { toString(): string }][], out: string }[] = [
      {in: [], out: ''},
      {in: [['a', 1]], out: 'a=1'},
      {in: [['a', 1], ['b', 'c']], out: 'a=1&b=c'},
      {in: [['a', 1], ['b', 'c d']], out: 'a=1&b=c%20d'},
    ];
    p.forEach(t => {
      assert.deepStrictEqual(toUrlParam(t.in), t.out);
    });
  });
});
