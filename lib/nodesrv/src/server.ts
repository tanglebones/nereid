// istanbul ignore file
// -- wrapper around node's createServer call
// -- can probably have some of the logic lifted out and tested...

import {
  contentHandlerType,
  ctxType,
  reqHandlerType,
  serverSettingsType,
  webSocketRpcType
} from "./server.type";

import {Server, IncomingMessage, ServerResponse} from "http";
import {sessionInfoCtor, sessionInitCtor, sessionSetCtor} from "./session";
import {ctxCtor} from "./ctx";
import {sessionExpire, sessionUpdate} from "./db/db_session";
import {dbProviderType} from "./db/db_provider.type";
import {webSocketInit} from "./web_socket";

const handleNotFound = (res: ServerResponse) => {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain');
  res.end('404 No route found');
};

const handleServerError = (res: ServerResponse, e: Error) => {
  res.statusCode = 500;
  res.setHeader('Content-Type', 'text/plain');
  res.end(`500 Server Error:\n${e}`);
};

type createServerType = (handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>) => Server;
type setIntervalType = <T>(callback: () => void, ms: number) => T;

export const serverFactoryCtor = (createServer: createServerType, setInterval: setIntervalType, tuidFactory: () => string) => (
  dbProvider: dbProviderType,
  settings: serverSettingsType,
  handlerArray: contentHandlerType[],
) => {
  const ha: contentHandlerType[] = [...handlerArray];

  let sessionInit: reqHandlerType | undefined = undefined;

  if (settings.session?.enabled) {
    sessionInit = sessionInitCtor(settings);
    const sessionSet = sessionSetCtor(settings);
    const sessionInfo = sessionInfoCtor(settings);

    ha.unshift(sessionInit, sessionSet, sessionInfo);
  }

  const runHandlerArray = async (ctx: ctxType) => {
    for (const handler of ha) {
      await handler(ctx);
      if (ctx.res.writableEnded) {
        return;
      }
    }
  };

  const requestHandler = async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const ctx = ctxCtor(req, res, dbProvider, settings);

      await runHandlerArray(ctx);
      if (settings.session?.enabled) {
        await sessionUpdate(ctx);
      }

      if (!res.writableEnded) {
        handleNotFound(res);
      }
    } catch (e) {
      console.error(e);
      if (!res.writableEnded) {
        handleServerError(res, e as Error);
      }
    }
  };

  const server = createServer(requestHandler);

  if (settings.session?.enabled) {
    setInterval(async () => {
      try {
        // noinspection JSIgnoredPromiseFromCall
        await sessionExpire(dbProvider);
      } catch (e) {
        // best we can do for now is log it as there is no request here to return an error to.
        console.error(e);
      }
    }, settings.session?.expiryIntervalMs ?? 60000);
  }

  server.listen(+settings.port, settings.host);


  let webSocketRpc: webSocketRpcType | undefined = undefined;

  if (settings.webSocket?.enabled) {
    webSocketRpc = webSocketInit(server, settings, sessionInit, dbProvider, tuidFactory);
  }

  return {server, webSocketRpc};
};
