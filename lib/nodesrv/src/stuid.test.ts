import * as assert from 'assert';
import {isStuid, stuidCtor, stuidEpochMicro} from './stuid';

describe('stuid', () => {
  it('Increase', () => {
    const bt = Date.now() * 1000;
    const a = [
      stuidCtor(), stuidCtor(), stuidCtor(), stuidCtor(),
      stuidCtor(), stuidCtor(), stuidCtor(), stuidCtor(),
      stuidCtor(), stuidCtor(), stuidCtor(), stuidCtor(),
      stuidCtor(), stuidCtor(), stuidCtor(), stuidCtor(),
    ];
    const at = Date.now() * 1000 + 999;

    a.forEach(v => {
      assert(isStuid(v));
      const us = stuidEpochMicro(v);
      assert(us);
      assert(us >= bt);
      assert(us < at);
    });

    for (let i = 0; i < a.length - 1; ++i) {
      if (a[i] >= a[i + 1]) {
        console.error(a[i], a[i + 1]);
      }
      assert(a[i] < a[i + 1], `${a[i]} < ${a[i + 1]}`);
    }
  });
});

describe('stuidEpochMicro', () => {
  it('Returns undefined if the TUID cannot be parsed', () => {
    assert.strictEqual(stuidEpochMicro(''), undefined);
    assert.strictEqual(stuidEpochMicro('foo'), undefined);
  });
});
