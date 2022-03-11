import {ctxReqType, ctxType, serverSettingsType} from './server.type';
import {IncomingMessage, ServerResponse} from 'http';
import {dbProviderType, dbProviderCtxType} from './db/db_provider.type';
import {resolvedFalse, resolvedTrue} from '@nereid/anycore';
import {Object} from 'ts-toolbelt';
import {toDbProvideCtx} from "./db/db_util";
import {parseUrl} from "./parse_url";
import {parseCookie} from "./parse_cookie";

export const ctxReqCtor = (
  req: IncomingMessage,
  dbProvider: dbProviderType,
  settings: serverSettingsType,
): ctxReqType => {
  const url = parseUrl(req.url?.toString() || '/');
  const cookie = parseCookie(req.headers.cookie);
  const dbProviderCtx = toDbProvideCtx('-', '-', dbProvider);
  return {
    req,
    url,
    sessionId: '',
    cookie,
    dbProvider,
    dbProviderCtx,
    settings,
    remoteAddress: req.socket?.remoteAddress || '',
  };
};

export const ctxCtor = (req: IncomingMessage, res: ServerResponse, dbProvider: dbProviderType, settings: serverSettingsType): ctxType => {
  const ctx = ctxReqCtor(req, dbProvider, settings) as ctxType;
  ctx.res = res;
  return ctx;
};

export const ctxSetDb = (ctx: { user?: { login?: string }, sessionId: string, dbProvider: dbProviderType, db?: dbProviderCtxType }): void => {
  ctx.db = toDbProvideCtx(ctx?.user?.login || '-', ctx.sessionId, ctx.dbProvider);
};

export const ctxBody = async (ctx: Pick<ctxType, 'body'> & Object.P.Pick<ctxType, ['req', 'method' | 'on']> & Object.P.Pick<ctxType, ['res', 'statusCode' | 'setHeader' | 'end']>, maxBodyLength = 1e6): Promise<boolean> => {
  if (ctx.body) {
    return resolvedTrue;
  }
  if (ctx.req.method !== 'POST') {
    ctx.res.statusCode = 405;
    ctx.res.setHeader('Content-Type', 'text/plain');
    ctx.res.end();
    return resolvedFalse;
  }
  // this assumes the LB in front of the service handles slow rollers for us.
  // otherwise this should be paired with a timeout.
  return new Promise<boolean>((r) => {
    const chunks: string[] = [];
    let totalChars = 0;
    ctx.req.on('data', (chunk: string) => {
      chunks.push(chunk);
      totalChars += chunk.length;
      if (totalChars > maxBodyLength) {
        ctx.res.statusCode = 413;
        ctx.res.setHeader('Content-Type', 'text/plain');
        ctx.res.end();
        r(false);
      }
    });
    ctx.req.on('end', () => {
      ctx.body = chunks.join('');
      r(true);
    });
  });
};

export const ctxHost = (ctx: Pick<ctxType, 'req' | 'host'>): void => {
  if (ctx.host) {
    return;
  }
  const hostHdr = ctx.req.headers.host;
  if (!hostHdr) {return;}
  if (hostHdr.match(/\blocalhost\b/)){
    ctx.host = 'localhost';
    return;
  }
  const m = hostHdr.match(/([^.]+\.)*(?<tld>[^.:]+\.[^.:]+)(:\d+)?$/);
  ctx.host = m?.groups?.tld;
};
