// istanbul ignore file
// will add tests once it is stable

import {ctxType, contentHandlerType, ctxReqType, reqHandlerType} from './server.type';
import {resolvedVoid} from 'ts_agnostic';
import {toDbProvideCtx} from './db_util';
import {sessionVerify} from './db';
import {ctxHost} from './ctx';

export type sessionInitCtorType = (settings: Record<string,unknown>) => reqHandlerType;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function sessionInitCtor(settings: Record<string,unknown>): reqHandlerType {
  async function sessionInit(ctx: ctxReqType): Promise<void> {
    const sessionIdFromCookie = ctx.cookie.find(e => e[0] === 'SessionId');
    if (sessionIdFromCookie) {
      ctx.sessionId = sessionIdFromCookie[1];
    }

    await sessionVerify(ctx);
  }
  return sessionInit;
}

export type sessionSetCtorType = (settings: {
  schema: string;
  host: string;
}) => contentHandlerType;

export function sessionSetCtor(
  settings: {
    schema: string;
  } & Record<string,unknown>
  ): contentHandlerType {
  function sessionSet(ctx: ctxType): Promise<void> {
    ctxHost(ctx);
    console.log('Session Host:', ctx.host);

    if (ctx.host) {
      // SameSite=Lax is required for the redirect from GoogleAuth back to our server to send cookies in Chrome.
      ctx.res.setHeader('Set-Cookie', `SessionId=${ctx.sessionId}; HttpOnly; Path=/; SameSite=None; Domain=${ctx.host}; Max-Age=3600${settings.schema === 'https' ? '; Secure' : ''}`);
    }
    // update ctx.db to use the sessionId as the tracking tag.
    ctx.db = toDbProvideCtx(ctx.user?.login||'-', ctx.sessionId, ctx.dbProvider);
    return resolvedVoid;
  }
  return sessionSet;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function sessionInfoCtor(settings: Record<string,unknown>): contentHandlerType {
  function sessionInfo(ctx: ctxType): Promise<void> {
    if (ctx.url.path !== '/session') {
      return resolvedVoid;
    }
    const { res } = ctx;
    res.setHeader('content-type','application/json');
    res.statusCode = 200;
    res.write(JSON.stringify(ctx.user));
    res.end();
    return resolvedVoid;
  }
  return sessionInfo;
}
