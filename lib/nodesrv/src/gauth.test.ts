import * as sinon from 'sinon';
import * as assert from 'assert';
import {gauthContinueCtor, gauthInitCtor} from './gauth';
import {gauthUserInfoType} from './server.type';

const settings = {
  sessionSecret: 'ss',
  appUrl: '/app',
  google: {
    id: 'gid',
    secret: 'gs',
    redirectUri: 'uri',
    initPath: '/init',
    continuePath: '/continue',
  },
};

describe('gauthInit', () => {
  it('Basics', async () => {
    const secureTokenCtor = sinon.stub();
    secureTokenCtor.returns('stoken');

    const subject = gauthInitCtor(settings, secureTokenCtor);

    const ctx: any = {
      url: {
        path: '/gauth/init',
      },
      res: {
        writeHead: sinon.stub(),
        end: sinon.stub(),
        setHeader: sinon.stub(),
      },
    };

    await subject(ctx);

    sinon.assert.calledOnce(ctx.res.end);
    sinon.assert.calledOnceWithExactly(
      ctx.res.writeHead,
      303,
      {
        Location: 'https://accounts.google.com/o/oauth2/v2/auth?'
          + 'client_id=gid'
          + '&redirect_uri=uri'
          + '&response_type=code'
          + '&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile'
          + '&state=stoken'
          + '&access_type=offline'
          + '&include_granted_scopes=true'
          + '&prompt=select_account%20consent'
        ,
      });
  });

  it('Ignores others paths', async () => {
    const secureTokenCtor = sinon.stub();

    const subject = gauthInitCtor(settings, secureTokenCtor);

    const ctx: any = {
      url: {
        path: '/asdf',
      },
      res: {
        writeHead: sinon.stub(),
        end: sinon.stub(),
        setHeader: sinon.stub(),
      },
    };

    await subject(ctx);

    sinon.assert.notCalled(secureTokenCtor);
    sinon.assert.notCalled(ctx.res.end);
    sinon.assert.notCalled(ctx.res.writeHead);
  });
});

describe('gauthContinue', () => {
  const setup = (userLogin) => {
    const secureTokenVerify = sinon.stub().returns('stoken');
    const userVivify = sinon.stub().resolves('user_id');

    const idTokenJson: gauthUserInfoType = {
      email: 'a@example.com',
      email_verified: true,
      family_name: 'a',
      given_name: 'example',
      name: 'A Example',
      locale: 'en-us',
      picture: 'http://example.com/picture',
    };
    let axiosData = {
      id_token: '{}.' + Buffer.from(JSON.stringify(idTokenJson)).toString('base64') + '.sig',
      other: 'stuff',
    };
    const poster = sinon.stub().resolves({
      data: axiosData,
    });

    const ctx: any = {
      url: {
        path: '/gauth/continue',
        params: [['state', 'stoken'], ['code', '4code']],
      },
      res: {
        writeHead: sinon.stub(),
        end: sinon.stub(),
        setHeader: sinon.stub(),
      },
      session: {},
      user: { login: userLogin },
    };

    return {secureTokenVerify, userVivify, poster, ctx, idTokenJson, axiosData}
  }

  it('Happy Path', async () => {
    const {secureTokenVerify, userVivify, poster, ctx, idTokenJson, axiosData} = setup('user_login_mock');

    const subject = gauthContinueCtor(settings, secureTokenVerify, userVivify, poster);
    await subject(ctx);

    sinon.assert.calledOnceWithExactly(
      poster,
      'https://oauth2.googleapis.com/token',
      'code=4code'
      + '&client_id=gid'
      + '&redirect_uri=uri'
      + '&client_secret=gs'
      + '&grant_type=authorization_code'
      ,
      {headers: {'Content-Type': 'application/x-www-form-urlencoded'}},
    );

    sinon.assert.calledOnceWithExactly(
      userVivify,
      ctx,
      idTokenJson,
      JSON.stringify(axiosData),
    );

    sinon.assert.calledOnceWithExactly(
      ctx.res.writeHead,
      303,
      {Location: '/app'},
    );

    sinon.assert.calledOnce(ctx.res.end);
  });

  it('No user', async () => {
    const {secureTokenVerify, userVivify, poster, ctx, idTokenJson, axiosData} = setup(undefined);

    const subject = gauthContinueCtor(settings, secureTokenVerify, userVivify, poster);
    await subject(ctx);

    sinon.assert.calledOnceWithExactly(
      poster,
      'https://oauth2.googleapis.com/token',
      'code=4code'
      + '&client_id=gid'
      + '&redirect_uri=uri'
      + '&client_secret=gs'
      + '&grant_type=authorization_code'
      ,
      {headers: {'Content-Type': 'application/x-www-form-urlencoded'}},
    );

    sinon.assert.calledOnceWithExactly(
      userVivify,
      ctx,
      idTokenJson,
      JSON.stringify(axiosData),
    );

    sinon.assert.calledOnceWithExactly(
      ctx.res.writeHead,
      403,
      'User not found.',
    );

    sinon.assert.calledOnce(ctx.res.end);
  });

  it('Handles invalid jwt', async () => {
    const secureTokenVerify = sinon.stub();
    const userVivify = sinon.stub();

    const poster = sinon.stub();

    let axiosData = {
      id_token: '{}.invalid.sig',
      other: 'stuff',
    };

    poster.resolves({
      data: axiosData,
    });

    secureTokenVerify.returns('stoken');

    const subject = gauthContinueCtor(settings, secureTokenVerify, userVivify, poster);

    const ctx: any = {
      url: {
        path: '/gauth/continue',
        params: [['state', 'stoken'], ['code', '4code']],
      },
      res: {
        writeHead: sinon.stub(),
        end: sinon.stub(),
        setHeader: sinon.stub(),
      },
      session: {},
    };

    await subject(ctx);

    sinon.assert.calledOnceWithExactly(
      poster,
      'https://oauth2.googleapis.com/token',
      'code=4code'
      + '&client_id=gid'
      + '&redirect_uri=uri'
      + '&client_secret=gs'
      + '&grant_type=authorization_code'
      ,
      {headers: {'Content-Type': 'application/x-www-form-urlencoded'}},
    );

    sinon.assert.notCalled(userVivify);
    assert.strictEqual(ctx.session.userId, undefined);
    sinon.assert.notCalled(ctx.res.writeHead);
    assert.strictEqual(ctx.res.statusCode, 400);
    sinon.assert.calledOnce(ctx.res.end);
    ctx.res.end.args[0][0].startsWith("Invalid Request");
  });

  it('Handles invalid stoken', async () => {
    const secureTokenVerify = sinon.stub();
    const userVivify = sinon.stub();
    const axios: any = {
      post: sinon.stub(),
    };

    secureTokenVerify.returns(undefined);

    const subject = gauthContinueCtor(settings, secureTokenVerify, userVivify, axios);

    const ctx: any = {
      url: {
        path: '/gauth/continue',
        params: [['state', 'stoken'], ['code', '4code']],
      },
      res: {
        writeHead: sinon.stub(),
        end: sinon.stub(),
        setHeader: sinon.stub(),
      },
      session: {},
    };

    await subject(ctx);

    sinon.assert.notCalled(axios.post);
    sinon.assert.notCalled(userVivify);
    assert.strictEqual(ctx.session.userId, undefined);
    sinon.assert.notCalled(ctx.res.writeHead);
    assert.strictEqual(ctx.res.statusCode, 400);
    sinon.assert.calledOnceWithExactly(ctx.res.end, "Invalid Request");
  });

  it('Ignores other paths', async () => {
    const secureTokenVerify = sinon.stub();
    const userVivify = sinon.stub();

    const axios: any = {
      post: sinon.stub(),
    };

    const subject = gauthContinueCtor(settings, secureTokenVerify, userVivify, axios);

    const ctx: any = {
      url: {
        path: '/asdf',
        params: [],
      },
      res: {
        writeHead: sinon.stub(),
        end: sinon.stub(),
        setHeader: sinon.stub(),
      },
      session: {},
    };

    await subject(ctx);

    sinon.assert.notCalled(axios.post);
    sinon.assert.notCalled(userVivify);
    assert.strictEqual(ctx.session.userId, undefined);
    sinon.assert.notCalled(ctx.res.writeHead);
    assert.strictEqual(ctx.res.statusCode, undefined);
    sinon.assert.notCalled(ctx.res.end);
  });
});
