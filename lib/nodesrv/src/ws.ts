// istanbul ignore file
// -- bootstrap

import {
  ctxReqType,
  ctxWsType,
  reqHandlerType,
  serverSettingsType,
  webSocketExtendedType,
  wsHandlerType,
} from './server.type';
import {IncomingMessage, Server} from 'http';
import WebSocket from 'ws';
import {Socket} from 'net';
import {ctxReqCtor} from './ctx';
import {serializableType} from "@nereid/anycore";
import {dbProviderType} from "./db/db_provider.type";
import {sessionUpdate} from "./db/db_session";

export type wsType = {
  wss: WebSocket.Server,
  call(ctxWs: ctxWsType, callName: string, params: serializableType): Promise<serializableType>,
};

export const wsInit = (
  wsHandlerRegistry: Readonly<Record<string,wsHandlerType>>,
  server: Server,
  settings: serverSettingsType,
  sessionInit: reqHandlerType,
  dbProvider: dbProviderType,
  tuidFactory: () => string,
  wsOnConnectHandler?: (ctxWs: ctxWsType) => Promise<serializableType>,
  wsOnCloseHandler?: (ctxWs: ctxWsType) => Promise<serializableType>,
) => {
  const wss = new WebSocket.Server({
    noServer: true,
    backlog: 32,
  });

  const heartbeat = (ctxWs: ctxWsType) => {
    console.log('heartbeat', ctxWs.sessionId);
    ctxWs.ws.isAlive = true;
  };

  const fromRemote = async (ctxWs: ctxWsType, data: WebSocket.RawData) => {
    try {
      const i: { id?: string; n?: string; a?: serializableType, s?: string, e?: serializableType, r?: serializableType } = JSON.parse(data.toString('utf8'));
      const ss = i.s?.[0];
      if (i.id && i.n && ss === '?') {
        try {
          const call = wsHandlerRegistry[i.n];
          if (call) {
            const r = await call(ctxWs, i.a);
            await sessionUpdate(ctxWs);
            ctxWs.ws.send(JSON.stringify({
              id: i.id,
              s: '+',
              r,
            }));
          } else {
            ctxWs.ws.send(JSON.stringify({
              id: i.id,
              s: '-NF',
            }));
          }
        } catch (e) {
          ctxWs.ws.send(JSON.stringify({
            id: i.id,
            s: '-EX',
            e,
          }));
        }
      } else if (i.id && (ss === '+' || ss === '-')) {
        const req = ctxWs.requests[i.id];
        delete ctxWs.requests[i.id];
        if (req) {
          if (ss === '+') {
            req.resolve(i.r);
          } else {
            req.reject(i.e);
          }
        }
      } else {
        ctxWs.ws.terminate();
      }
    } catch {
      ctxWs.ws.terminate();
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const noop = () => {

  };

  const ping = () => {
    console.log('sending pings');
    wss.clients.forEach((ws: WebSocket) => {
      const wse = ws as webSocketExtendedType;
      if (!wse.isAlive) return ws.terminate();
      wse.isAlive = false;
      ws.ping(noop);
    });
  };

  setInterval(ping, 30000);

  const ctxWsRegistry = {} as Record<string, ctxWsType>;

  const onClose = async (ctxWs: ctxWsType) => {
    const removed = ctxWsRegistry[ctxWs.sessionId];
    delete ctxWsRegistry[ctxWs.sessionId];
    if (removed) {
      try {
        await wsOnCloseHandler?.(ctxWs);
      } catch (e) {
        console.error('onClose exception:', e);
      }

      for (const [id, req] of Object.entries(ctxWs.requests)) {
        if (req?.ctxWs === ctxWs) {
          delete ctxWs.requests[id];
          req?.reject({id, s: '-CC'});
        }
      }
    }
  };

  wss.on('connection', async (ctxWs: ctxWsType) => {
    if (ctxWs.ws.protocol !== 'rpc_v1') {
      ctxWs.ws.send({supportedProtocols: ['rpc_v1']});
      ctxWs.ws.terminate();
      return;
    }
    ctxWs.ws.isAlive = true;
    ctxWs.ws.on('close', () => onClose(ctxWs));
    ctxWs.ws.on('pong', () => heartbeat(ctxWs));
    try {
      await wsOnConnectHandler?.(ctxWs);
    } catch (e) {
      console.error('onConnect exception:', e);
    }
    ctxWs.ws.on('message', data => fromRemote(ctxWs, data));
  });

  const isActive = (ws: WebSocket | undefined): boolean => ws?.readyState === WebSocket.OPEN;

  const processPending = (): void => {
    Object.values(ctxWsRegistry).forEach(ctx => {
      const ids = Object.keys(ctx.requests);
      for (const id of ids) {
        const r = ctx.requests[id];
        if (r && isActive(r.ctxWs?.ws) && !r.sent) {
          r.ctxWs.ws?.send(r.data);
          r.sent = true;
        }
      }
    });
  };

  const call = (ctxWs: ctxWsType, callName: string, params: serializableType) =>
    new Promise<serializableType>(
      (resolve, reject) => {
        const id = tuidFactory();
        const data = JSON.stringify({id, n: callName, a: params, s: '?'});
        ctxWs.requests[id] = {
          ctxWs,
          id,
          resolve,
          reject,
          data,
          sent: false,
        };
        if (isActive(ctxWs.ws)) {
          processPending();
        }
      });

  type IncomingMessageEx = IncomingMessage & { _: { ctx: ctxReqType } };

  wss.on('headers', (headers: string[], req: IncomingMessage) => {
    const hostHdr = req.headers.host;
    const m = hostHdr?.match(/([^.]+\.)*(?<tld>[^.:]+\.[^.:]+)(:\d+)?$/);
    const host = m?.groups?.tld;

    if (host) {
      const ctx = (req as IncomingMessageEx)._.ctx;
      const sessionId = ctx.sessionId;
      // SameSite=Lax is required for the redirect from GoogleAuth back to our server to send cookies in Chrome.
      const header = `Set-Cookie: SessionId=${sessionId}; HttpOnly; Path=/; SameSite=None; Domain=${host}; Max-Age=3600${settings.schema === 'https' ? '; Secure' : ''}`;
      headers.push(header);
    }
  });

  server.on('upgrade', async (req: IncomingMessage, socket: Socket, head: Buffer) => {
    try {
      const ctx = ctxReqCtor(req, dbProvider, settings);
      const pathname = ctx.url.path;
      if (pathname !== '/ws') {
        socket.destroy();
        return;
      }

      await sessionInit(ctx);
      const reqEx = req as IncomingMessageEx;

      // this is a hack to get the ctx to the headers event where we need the sessionId
      reqEx._ = {ctx};

      wss.handleUpgrade(req, socket, head, ws => {
        try {
          const wsX: webSocketExtendedType = ws as webSocketExtendedType;
          wsX.isAlive = true;

          const ctxWs: ctxWsType = {
            ws: wsX,
            remoteAddress: ctx.remoteAddress,
            sessionId: ctx.sessionId,
            session: ctx.session,
            user: ctx.user,
            dbProviderCtx: ctx.dbProviderCtx,
            dbProvider: ctx.dbProvider,
            permission: ctx.permission,
            requests: {},
            call(name: string, params: serializableType): Promise<serializableType> {
              return call(ctxWs, name, params);
            },
            settings,
          };

          // sessions can't be shared
          const existingConnection = ctxWsRegistry[ctxWs.sessionId];
          if (existingConnection) {
            onClose(existingConnection);
            ctxWs.ws.close();
            delete ctxWsRegistry[ctxWs.sessionId];
          }

          ctxWsRegistry[ctxWs.sessionId] = ctxWs;

          wss.emit('connection', ctxWs);
        } catch (e) {
          console.error('handleUpdate exception', e);
        }
      });
    } catch (e) {
      console.error('update exception', e);
    }
  });

  return {wss, call};
};
