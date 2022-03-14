// istanbul ignore file
// will add tests once it is stable

import {contentHandlerType, ctxReqType, ctxType, reqHandlerType} from './server.type';
import {resolvedVoid} from '@nereid/anycore';
import {toDbProvideCtx} from './db/db_util';
import {sessionVerify} from './db/db_session';
import {ctxHost} from './ctx';
import debugCtor from 'debug';

const debug = debugCtor('session');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const sessionInitCtor = (_settings: Record<string, unknown>): reqHandlerType =>
  async (ctx: ctxReqType) => {
    if (!ctx.settings.session?.enabled) {
      return resolvedVoid;
    }
    const cookieName = ctx.settings.session?.cookieName ?? 'SessionId';
    const sessionIdFromCookie = ctx.cookie.find(e => e[0] === cookieName);

    if (sessionIdFromCookie) {
      ctx.sessionId = sessionIdFromCookie[1];
    }

    await sessionVerify(ctx);
  };

export const sessionSetCtor = (
  settings: {
    schema: string;
  } & Record<string, unknown>
): contentHandlerType =>
  (ctx: ctxType) => {
    if (!ctx.settings.session?.enabled) {
      return resolvedVoid;
    }

    ctxHost(ctx);
    debug('Session Host:', ctx.host);

    if (ctx.host) {
      const cookieName = ctx.settings.session?.cookieName ?? 'SessionId';
      const maxAge = ctx.settings.session?.expiry ?? 3600;
      // SameSite=Lax is required for the redirect from GoogleAuth back to our server to send cookies in Chrome.
      // it is also now required for localhost dev to work cause chrome is shite.
      // And installing SSL certs for localhost as a work around is STUPID. Especially since SSL termination is done at the LB!
      ctx.res.setHeader('Set-Cookie', `${cookieName}=${ctx.sessionId}; HttpOnly; Path=/; SameSite=Lax; Domain=${ctx.host}; Max-Age=${maxAge}${settings.schema === 'https' ? '; Secure' : ''}`);
    }
    // update ctx.db to use the sessionId as the tracking tag.
    ctx.dbProviderCtx = toDbProvideCtx(ctx.user?.login || '-', ctx.sessionId, ctx.dbProvider);
    return resolvedVoid;
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const sessionInfoCtor = (_settings: Record<string, unknown>): contentHandlerType =>
  (ctx: ctxType) => {
    if (!ctx.settings.session?.enabled) {
      return resolvedVoid;
    }
    if (ctx.url.path !== '/session') {
      return resolvedVoid;
    }
    const {res} = ctx;
    res.setHeader('content-type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify(ctx.user));
    return resolvedVoid;
  };
