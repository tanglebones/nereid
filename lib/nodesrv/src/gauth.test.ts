import sinon from 'sinon';
import assert from 'assert';
import {gauthCtor} from './gauth';
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

const getSut = ({login, path, params, axiosData}: {
  login?: string,
  path: string,
  params?: [string, string][],
  axiosData?: { id_token: string, [key: string]: unknown }
}) => {
  const secureTokenFactory = {create: sinon.stub(), verify: sinon.stub()};
  const userVivify = sinon.stub().resolves('user_id');

  secureTokenFactory.create.returns('stoken');

  const idTokenJson: gauthUserInfoType = {
    email: 'a@example.com',
    email_verified: true,
    family_name: 'a',
    given_name: 'example',
    name: 'A Example',
    locale: 'en-us',
    picture: 'http://example.com/picture',
  };

  axiosData ??= {
    id_token: '{}.' + Buffer.from(JSON.stringify(idTokenJson)).toString('base64') + '.sig',
    other: 'stuff',
  };

  const poster = sinon.stub().resolves({
    data: axiosData,
  });

  const ctx: any = {
    url: {
      path,
      params,
    },
    res: {
      writeHead: sinon.stub(),
      end: sinon.stub(),
      setHeader: sinon.stub(),
    },
    session: {},
    user: {login},
  };
  const subject = gauthCtor(settings, secureTokenFactory, userVivify, poster);
  return {secureTokenFactory, userVivify, poster, ctx, idTokenJson, axiosData, subject}
}

describe('gauth.init', () => {
  it('Basics', async () => {
    const {ctx, subject} = getSut({login: 'user_login_mock', path: '/gauth/init'});

    await subject.init(ctx);

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
    const {ctx, subject, secureTokenFactory} = getSut({login: 'user_login_mock', path: '/gauth/init'});

    ctx.url.path = '/gauth/init';

    await subject.init(ctx);

    sinon.assert.notCalled(secureTokenFactory.create);
    sinon.assert.notCalled(ctx.res.end);
    sinon.assert.notCalled(ctx.res.writeHead);
  });
});

describe('gauth.resume', () => {
  it('Happy Path', async () => {
    const {userVivify, poster, ctx, idTokenJson, axiosData, subject} = getSut({
      login: 'user_login_mock',
      path: '/gauth/resume',
      params: [['state', 'stoken'], ['code', '4code']]
    });

    await subject.resume(ctx);

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
  })
  ;

  it('No user', async () => {
    const {userVivify, poster, ctx, idTokenJson, axiosData, subject} = getSut({
      path: '/gauth/resume',
      params: [['state', 'stoken'], ['code', '4code']]
    });
    await subject.resume(ctx);

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
    const {userVivify, poster, ctx, subject} = getSut({
      path: '/gauth/resume',
      params: [['state', 'stoken'], ['code', '4code']],
      axiosData: {
        id_token: '{}.invalid.sig',
        other: 'stuff',
      }
    });

    await subject.resume(ctx);

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
    const {userVivify, poster, ctx, subject, secureTokenFactory} = getSut({
      path: '/gauth/resume',
      params: [['state', 'stoken'], ['code', '4code']],
    });

    secureTokenFactory.verify.returns(undefined);

    await subject.resume(ctx);

    sinon.assert.notCalled(poster);
    sinon.assert.notCalled(userVivify);
    assert.strictEqual(ctx.session.userId, undefined);
    sinon.assert.notCalled(ctx.res.writeHead);
    assert.strictEqual(ctx.res.statusCode, 400);
    sinon.assert.calledOnceWithExactly(ctx.res.end, "Invalid Request");
  });

  it('Ignores other paths', async () => {
    const {userVivify, poster, ctx, subject} = getSut({
      login: 'user_login_mock',
      path: '/asdf',
      params: [['state', 'stoken'], ['code', '4code']]
    });

    await subject.resume(ctx);

    sinon.assert.notCalled(poster);
    sinon.assert.notCalled(userVivify);
    assert.strictEqual(ctx.session.userId, undefined);
    sinon.assert.notCalled(ctx.res.writeHead);
    assert.strictEqual(ctx.res.statusCode, undefined);
    sinon.assert.notCalled(ctx.res.end);
  });
});
