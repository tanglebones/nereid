import {crCtor} from './cr';
import assert from 'assert';
import {secureTokenFactoryCtor} from "./stoken";
import {stuidForTestingFactoryCtor} from "./stuid";

const testCrCtor = (nowMs = 0) => {
  const secureTokenFactory = secureTokenFactoryCtor("asdf", stuidForTestingFactoryCtor());
  const randomBytes = (n: number) => Buffer.alloc(n, 0);
  return crCtor(secureTokenFactory, () => nowMs, randomBytes);
};

describe('cr', () => {
  const cr = testCrCtor();

  it('basics', () => {
    const password = 'testing123';

    // -- ACCOUNT CREATION
    // server
    const {nb64} = cr.serverInit();
    // -- record username initiated login in login_log w/ remote IP & user agent info
    // -- send nb64 to client

    // client
    const {hpnb64} = cr.clientInit(password, nb64);
    // -- send hpn64 to server

    // server
    const {q} = cr.serverSetup(hpnb64);

    // -- stores n, q, r='' against username.

    // -- LOGIN

    // server
    const {r} = cr.serverInitChallenge();
    // -- store r against username
    // -- send nb64, r, salt to client
    const salt = cr.getSalt(q); // -- q is *not* sent to the client!

    // client
    const {fb64} = cr.clientResponse(r, nb64, salt, password);

    // -- send fb64 to server

    // server

    // -- verifies rb64 matches for username, token is valid, token is <10 minutes old
    // -- swaps r to '' (one use only)

    const verified = cr.serverVerify(fb64, r, q);
    // -- record username success/failure of login in login_log  w/ remote IP & user agent info

    assert(verified);
  });

  it('invalid password', () => {
    const password = 'testing123';

    // -- ACCOUNT CREATION
    // server
    const {nb64} = cr.serverInit();
    // -- record username initiated login in login_log w/ remote IP & user agent info
    // -- send nb64 to client

    // client
    const {hpnb64} = cr.clientInit(password, nb64);
    // -- send hpn64 to server

    // server
    const {q} = cr.serverSetup(hpnb64);
    // -- stores n, q, r='' against username.


    // -- LOGIN

    // server
    const {r} = cr.serverInitChallenge();
    // -- store r against username
    // -- send nb64, r, salt to client

    // client
    const salt = cr.getSalt(q);
    const {fb64} = cr.clientResponse(r, nb64, salt, 'testing124');

    // -- send fb64 to server

    // server

    // -- verifies rb64 matches for username, token is valid, token is <10 minutes old
    // -- swaps r to '' (one use only)

    const verified = cr.serverVerify(fb64, r, q);
    // -- record username success/failure of login in login_log  w/ remote IP & user agent info

    assert(!verified);
  });

  it('known case', () => {
    const r = "0005bba40debad081abe1faf9d3685b50d7af9990afe17da81d2affa6c7a8f25|306d165550ef10e7d58c0dbd68f7333c25dc094345d0b58e1c6eb673ebcb680c"
    const nb64 = "0AIknPMK3vwDj1GXQbWjxlvL5AkCC+bP7xOC9ePjBGE="
    const salt = "$2a$10$mnymedWwVuipoNpzlfYPs."
    const password = 'asdfasdf';

    const {fb64} = cr.clientResponse(r, nb64, salt, password);
    const fb64Expected = "hMXJUBYERTverlr01LIz9Kq8ky9V3zIDT2oou3CfMn19CZz9Zx4FNs6uO7/BXHRMT6L0nzgdRIMo3a3eW5x+RQ==";
    assert(fb64 === fb64Expected);
  });
});

describe('cr.serverSetup', () => {
  const cr = testCrCtor();

  it('Throws an error if the HPN is bad', () => {
    try {
      cr.serverSetup('definitely not a valid HPN');
    } catch (e) {
      assert.strictEqual((e as Error).message, 'INVALID_PARAMETERS')
    }
  });
});

describe('cr.serverVerify', () => {
  const cr = testCrCtor(3e10);

  it('Returns false if the stoken cannot be verified', () => {
    assert.strictEqual(cr.serverVerify('fb64', 'r', 'q'), false);
  });

  it('Returns false if the stuid is too old.', () => {
    // setup based on 'basics' test
    const password = 'testing123';
    const {nb64} = cr.serverInit();
    const r = '0005c0a9c411d7d83e5885b626410f476d74aaafe3c7233bbbbfd46c2606109ce0c9adef89b3e98bff6c7433d500c636a443fa3407eb2d29ed1ee7f17fb9a307';
    const {hpnb64} = cr.clientInit(password, nb64);
    const {q} = cr.serverSetup(hpnb64);

    assert.strictEqual(
      cr.serverVerify(
        'fb64',
        r,
        q,
      ),
      false
    );
  })
});
