import {secureTokenCtor, secureTokenVerify} from './stoken';
import * as assert from 'assert';
import {stuidZero} from './stuid';

describe('stoken', () => {
  it('basics', () => {
    const token = secureTokenCtor('bob');
    const t = secureTokenVerify(token, 'bob');
    assert(t);
    assert(token.startsWith(t));
  });
  it('invalid', () => {
    assert(!secureTokenVerify(undefined, 'bob'));
    assert(!secureTokenVerify(stuidZero, 'bob'));
  });
});
