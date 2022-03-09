import {ctxBaseType, ctxType, gauthUserInfoType} from './server.type';
import {secureTokenFactoryType} from "./stoken";
import {resolvedVoid} from "@nereid/anycore";
import {toUrlParam} from "@nereid/anycore/dist/to_url_param";
import {kvpArrayToObject} from "@nereid/anycore/dist/kvp_array_to_object";

export type gauthOnUserDataType = (ctx: ctxBaseType, gauthUserInfo: gauthUserInfoType, rawAuthResponse: string) => Promise<void>;
export const gauthCtor = (
  settings: {
    google: {
      redirectUri: string,
      id: string,
      secret: string,

    },
    appUrl: string,
  },
  secureTokenFactory: secureTokenFactoryType,
  onUserData: gauthOnUserDataType,
  poster: <T>(url: string, body: string, options: { headers: Record<string, string> }) => Promise<{ data: T }>) => {

  const init = (ctx: ctxType) => {
    if (ctx.url.path !== '/gauth/init') {
      return resolvedVoid;
    }
    const token = secureTokenFactory.create();
    const params: [string, string][] = [
      ['client_id', settings.google.id],
      ['redirect_uri', settings.google.redirectUri],
      ['response_type', 'code'],
      ['scope', 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'],
      ['state', token],
      ['access_type', 'offline'],
      ['include_granted_scopes', 'true'],
      ['prompt', 'select_account consent'],
    ];
    const location = 'https://accounts.google.com/o/oauth2/v2/auth?' + toUrlParam(params);

    ctx.res.writeHead(
      303,
      {
        Location: location,
      });
    ctx.res.end();
    return resolvedVoid;
  };

  const jwtTrustedDecode = (data: string) => {
    // doesn't check the signature, as we already trust the source.
    return JSON.parse(Buffer.from(data.split('.')[1], 'base64').toString('utf-8'));
  };

  const resume = async (ctx: ctxType) => {
    if (!(ctx.url.path === '/gauth/continue' || ctx.url.path === '/gauth/resume')) {
      return resolvedVoid;
    }
    const {state, code} = kvpArrayToObject(ctx.url.params) as { state: string, code: string };
    const stuid = secureTokenFactory.verify(state);

    // TODO: check age of stuid, reject if older than X mins.
    if (!state || !code || !stuid) {
      ctx.res.statusCode = 400;
      ctx.res.end('Invalid Request');
      return resolvedVoid;
    }
    try {
      const r = await poster<Record<string, unknown>>(
        'https://oauth2.googleapis.com/token',
        toUrlParam([
          ['code', code],
          ['client_id', settings.google.id],
          ['redirect_uri', settings.google.redirectUri],
          ['client_secret', settings.google.secret],
          ['grant_type', 'authorization_code'],
        ]),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}},
      );
      const userData = jwtTrustedDecode(r.data.id_token as string) as gauthUserInfoType;
      await onUserData(ctx, userData, JSON.stringify(r.data));
      if (!ctx.user?.login) {
        ctx.res.writeHead(403, 'User not found.');
      } else {
        ctx.res.writeHead(303, {Location: settings.appUrl});
      }
      ctx.res.end();
    } catch (e) {
      ctx.res.statusCode = 400;
      ctx.res.setHeader('content-type', 'text/plain');
      ctx.res.end(`Invalid Request:\n${e}`);
    }
    return resolvedVoid;
  }
  return {init, resume};
};

export type gauthType = ReturnType<typeof gauthCtor>;
