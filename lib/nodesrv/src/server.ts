// istanbul ignore file
// -- bootstrap

import {createServer, IncomingMessage, Server, ServerResponse} from 'http';
import {contentHandlerType, ctxType, wsHandlerType, serverSettingsType, ctxWsType, ctxReqType} from './server.type';
import {ctxCtor} from './ctx';
import {gauthContinueCtor, gauthInitCtor, gauthOnUserData} from './gauth';
import {sessionInfoCtor, sessionInitCtor, sessionSetCtor} from './session';
import {secureTokenCtor, secureTokenVerify} from './stoken';
import axios from 'axios';
import {wsInit, wsType} from './ws';
import {readonlyRegistryCtor, readonlyRegistryType} from 'ts_agnostic';
import {serializableType} from 'ts_agnostic';
import {dbProviderCtor, sessionExpire, sessionUpdate} from './db';

//----------------------

export function server(
  settings: serverSettingsType,
  handlerArray: contentHandlerType[],
  wsHandlerRegistry?: readonlyRegistryType<wsHandlerType>,
  wsOnConnectHandler?: (ctxWs: ctxWsType) => Promise<serializableType>,
  wsOnCloseHandler?: (ctxWs: ctxWsType) => Promise<serializableType>,
  onUserData?: gauthOnUserData,
): { server: Server, ws?: wsType } {
  if (!wsHandlerRegistry) {
    wsHandlerRegistry = readonlyRegistryCtor<wsHandlerType>([]);
  }

  function handleNotFound(res: ServerResponse) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end('404 No route found');
  }

  let ha: contentHandlerType[] = [];

  async function runHandlerArray(ctx: ctxType) {
    for (const handler of ha) {
      await handler(ctx);
      if (ctx.res.writableEnded) {
        return;
      }
    }
  }

  function handleServerError(res: ServerResponse, e: Error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain');
    res.end(`500 Server Error:\n${e}`);
  }

  let sessionInit: contentHandlerType | undefined = undefined;
  let sessionSet: contentHandlerType | undefined = undefined;
  let sessionInfo: contentHandlerType | undefined = undefined;

  if (settings.mode) {
    sessionInit = sessionInitCtor(settings);
    sessionSet = sessionSetCtor(settings);
    sessionInfo = sessionInfoCtor(settings);
  }

  let gauthInit: (ctx: ctxType) => Promise<void>;
  let gauthContinue: (ctx: ctxType) => Promise<void>;

  // you must set mode to use gauth
  if (settings.google && onUserData && settings.mode) {
    gauthInit = gauthInitCtor({
        google: settings.google,
      },
      secureTokenCtor,
    );

    gauthContinue = gauthContinueCtor({
        appUrl: settings.appUrl,
        google: settings.google,
      },
      secureTokenVerify,
      onUserData,
      axios.post,
    );
    // istanbul ignore next: these must be defined by the logic above, but the compiler is not that smart.
    if (sessionInit && sessionSet && sessionInfo) {
      ha = [sessionInit, sessionSet, gauthInit, gauthContinue, sessionInfo, ...handlerArray];
    }
  } else {
    if (sessionInit && sessionSet && sessionInfo) {
      ha = [sessionInit, sessionSet, sessionInfo, ...handlerArray];
    } else {
      ha = handlerArray;
    }
  }

  const dbProvider = dbProviderCtor(settings.dbConnectionString);

  async function requestHandler(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const ctx = ctxCtor(req, res, dbProvider, settings);

      await runHandlerArray(ctx);

      await sessionUpdate(ctx);

      if (!res.writableEnded) {
        handleNotFound(res);
      }
    } catch (e) {
      console.error(e);
      if (!res.writableEnded) {
        handleServerError(res, e);
      }
    }
  }

  const server: Server = createServer(requestHandler);

  setInterval(async () => {
    console.log('expiring sessions');
    try {
      // noinspection JSIgnoredPromiseFromCall
      await sessionExpire(dbProvider);

    } catch (e) {
      console.log(e);
    }
  }, 60000);

  server.listen(+settings.port, settings.host);

  let ws: wsType | undefined;
  if (settings.mode) {
    // istanbul ignore next: these must be defined by the logic above, but the compiler is not that smart.
    if (sessionInit) {
      ws = wsInit(wsHandlerRegistry, server, settings, sessionInit, dbProvider, wsOnConnectHandler, wsOnCloseHandler);
    }
  }
  return {server, ws};
}
