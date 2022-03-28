// istanbul ignore file
// -- bootstrap

import {
  ctxReqType,
  ctxWebSocketType,
  reqHandlerType,
  serverSettingsType,
  webSocketExtendedType,
  webSocketHandlerType,
} from './server.type';
import {IncomingMessage, Server} from 'http';
import WebSocket from 'ws';
import {Socket} from 'net';
import {ctxReqCtor} from './ctx';
import {serializableType, serialize} from "@nereid/anycore";
import {dbProviderType} from "./db/db_provider.type";
import {sessionUpdate} from "./db/db_session";

export type webSocketType = {
  wss: WebSocket.Server,
  call(ctxWebSocket: ctxWebSocketType, callName: string, params: serializableType): Promise<serializableType>,
};

export const webSocketInit = (
  webSocketHandlerRegistry: Readonly<Record<string, webSocketHandlerType>>,
  server: Server,
  settings: serverSettingsType,
  sessionInit: reqHandlerType | undefined,
  dbProvider: dbProviderType,
  tuidFactory: () => string,
  onConnectHandler?: (ctxWs: ctxWebSocketType) => Promise<serializableType>,
  onCloseHandler?: (ctxWs: ctxWebSocketType) => Promise<serializableType>,
) => {
  const webSocketServer = new WebSocket.Server({
    noServer: true,
    backlog: 32,
  });

  const heartbeat = (ctxWs: ctxWebSocketType) => {
    ctxWs.ws.isAlive = true;
  };

  const fromRemote = async (ctxWs: ctxWebSocketType, data: WebSocket.RawData) => {
    try {
      const packet: {
        id?: string;
        n?: string; // name
        a?: serializableType, // args
        s?: string, // state
        e?: serializableType, // error
        r?: serializableType // result
      } = JSON.parse(data.toString('utf8'));
      const state = packet.s?.[0];
      if (packet.id && packet.n && state === '?') {
        try {
          const call = webSocketHandlerRegistry[packet.n];
          if (call) {
            const r = await call(ctxWs, packet.a);
            if (ctxWs.settings.session?.enabled) {
              await sessionUpdate(ctxWs);
            }
            ctxWs.ws.send(JSON.stringify({
              id: packet.id,
              s: '+',
              r,
            }));
          } else {
            ctxWs.ws.send(JSON.stringify({
              id: packet.id,
              s: '-NF',
            }));
          }
        } catch (e) {
          ctxWs.ws.send(JSON.stringify({
            id: packet.id,
            s: '-EX',
            e,
          }));
        }
      } else if (packet.id && (state === '+' || state === '-')) {
        const req = ctxWs.requests[packet.id];
        delete ctxWs.requests[packet.id];
        if (req) {
          if (state === '+') {
            req.resolve(packet.r);
          } else {
            req.reject(packet.e);
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
    webSocketServer.clients.forEach((ws: WebSocket) => {
      const wse = ws as webSocketExtendedType;
      if (!wse.isAlive) {
        return ws.terminate();
      }
      wse.isAlive = false;
      ws.ping(noop);
    });
  };

  setInterval(ping, 30000);

  const ctxWsRegistry = {} as Record<string, ctxWebSocketType>;

  const onClose = async (ctxWs: ctxWebSocketType) => {
    const removed = ctxWsRegistry[ctxWs.sessionId];
    delete ctxWsRegistry[ctxWs.sessionId];
    if (removed) {
      try {
        await onCloseHandler?.(ctxWs);
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

  webSocketServer.on('connection', async (ctxWs: ctxWebSocketType) => {
    if (ctxWs.ws.protocol !== 'rpc1') {
      ctxWs.ws.send(serialize({supportedProtocols: ['rpc1']}));
      ctxWs.ws.terminate();
      return;
    }
    ctxWs.ws.isAlive = true;
    ctxWs.ws.on('close', () => onClose(ctxWs));
    ctxWs.ws.on('pong', () => heartbeat(ctxWs));
    try {
      await onConnectHandler?.(ctxWs);
    } catch (e) {
      console.error('onConnect exception:', e);
    }
    ctxWs.ws.on('message', data => fromRemote(ctxWs, data));
  });

  const processPending = () => {
    Object.values(ctxWsRegistry).forEach(ctx => {
      const ids = Object.keys(ctx.requests);
      for (const id of ids) {
        const r = ctx.requests[id];
        if (r?.ctxWs?.ws?.readyState === WebSocket.OPEN && !r.sent) {
          r.ctxWs.ws?.send(r.data);
          r.sent = true;
        }
      }
    });
  };

  const call = (ctxWs: ctxWebSocketType, callName: string, params: serializableType) =>
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
        if (ctxWs.ws?.readyState === WebSocket.OPEN) {
          processPending();
        }
      });

  type IncomingMessageEx = IncomingMessage & { _: { ctx: ctxReqType } };

  webSocketServer.on('headers', (headers: string[], req: IncomingMessage) => {
    // this is a hack to get the ctx to the headers event where we need the session data
    const ctx = (req as IncomingMessageEx)._.ctx;
    if (!settings.session?.enabled) {
      return;
    }

    // emulate ctxHost and
    const hostHdr = req.headers.host;

    // match not a ., a ., then not a . or :, then optionally a :port.
    // this gives the domain without any subdomains or ports.
    const m = hostHdr?.match(/(?<tld>[^.]+\.[^.:]+)(:\d+)?$/);
    const host = m?.groups?.tld;

    if (host) {
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

      if (sessionInit) {
        await sessionInit(ctx);
      }

      const reqEx = req as IncomingMessageEx;

      // this is a hack to get the ctx to the headers event where we need the session data
      reqEx._ = {ctx};

      webSocketServer.handleUpgrade(req, socket, head, ws => {
        try {
          const wsX: webSocketExtendedType = ws as webSocketExtendedType;
          wsX.isAlive = true;

          const ctxWs: ctxWebSocketType = {
            ws: wsX,
            remoteAddress: ctx.remoteAddress,
            sessionId: ctx.sessionId || tuidFactory(), // ||, not ??, so we replace '' with a sessionId.
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

          webSocketServer.emit('connection', ctxWs);
        } catch (e) {
          console.error('handleUpdate exception', e);
        }
      });
    } catch (e) {
      console.error('update exception', e);
    }
  });

  return {wss: webSocketServer, call};
};
