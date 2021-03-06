import {secureTokenFactoryCtor} from './stoken';
import assert from 'assert';
import {stuidForTestingFactoryCtor, stuidZeroBase64url} from "./stuid";

describe('stoken', () => {
  const secureTokenFactory = secureTokenFactoryCtor("aoeu", stuidForTestingFactoryCtor());

  it('basics', () => {
    const token = secureTokenFactory.create();
    const t = secureTokenFactory.verify(token);
    assert(t);
    assert(token.startsWith(t));
  });

  it('invalid', () => {
    assert(!secureTokenFactory.verify(undefined));
    assert(!secureTokenFactory.verify(stuidZeroBase64url));
  });
});
