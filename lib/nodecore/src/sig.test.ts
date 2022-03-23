import {sigCtor} from './sig';
import * as assert from 'assert';

describe('sig', () => {
  it('basics', () => {
    const sig1 = sigCtor('bob')({a:1});
    const sig2 = sigCtor('alice')({a:1});

    assert.strictEqual(sig1,'ba0c10178ad87e1718fd3c3c13c65482a32f3e59ec953bcb3d166b4ea59f20c5');
    assert.strictEqual(sig2, '4cae87a1cbfb14ea40ff3900ce3719bdf79b7b04278ed73f7ac7d530c3e2faf0');
  });
});
