import assert from 'assert';
import {memoize} from './memoize';

describe('memoize', () => {
  it('calls once', () => {
    const f = () => {
      f.c += 1;
    }

    f.c = 0;

    const g = memoize(f);

    assert.ok(f.c === 0);

    g();
    // the linter sucks and assumes g() is pure and won't touch c. :(
    // @ts-ignore
    assert.ok(f.c === 1);

    g();
    assert.ok(f.c === 1);
  });
});
