// istanbul ignore file
// -- bootstrap

import {createServer, IncomingMessage, Server, ServerResponse} from 'http';
import {contentHandlerType, ctxType, wsHandlerType, serverSettingsType, ctxWsType} from './server.type';
import {ctxCtor} from './ctx';
import {gauthCtor, gauthOnUserDataType, gauthType} from './gauth';
import {sessionInfoCtor, sessionInitCtor, sessionSetCtor} from './session';
import {secureTokenFactoryCtor} from './stoken';
import axios from 'axios';
import {wsInit, wsType} from './ws';
import {readonlyRegistryFactory, serializableType, readonlyRegistryType} from '@nereid/anycore';
import {sessionExpire, sessionUpdate} from './db/db_session';
import {stuidFactoryCtor, tuidFactoryCtor} from "@nereid/nodecore";
import {randomFillSync} from "crypto";
import {dbProviderCtor} from "./db/db_provider";

//----------------------
const nowMs = () => +new Date();
const tuidFactory = tuidFactoryCtor(randomFillSync, nowMs, "base64url");
const stuidFactory = stuidFactoryCtor(randomFillSync, nowMs, "base64url");
const secureTokenFactory = secureTokenFactoryCtor("temp", stuidFactory);

export function server(
  settings: serverSettingsType,
  handlerArray: contentHandlerType[],
  wsHandlerRegistry?: readonlyRegistryType<wsHandlerType>,
  wsOnConnectHandler?: (ctxWs: ctxWsType) => Promise<serializableType>,
  wsOnCloseHandler?: (ctxWs: ctxWsType) => Promise<serializableType>,
  onUserData?: gauthOnUserDataType,
): { server: Server, ws?: wsType } {
  if (!wsHandlerRegistry) {
    wsHandlerRegistry = readonlyRegistryFactory<wsHandlerType>([]);
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

  const sessionInit = sessionInitCtor(settings);
  const sessionSet = sessionSetCtor(settings);
  const sessionInfo = sessionInfoCtor(settings);
  let gauth: gauthType;

  if (settings.google && onUserData) {
    gauth = gauthCtor({
        appUrl: settings.appUrl,
        google: settings.google,
      },
      secureTokenFactory,
      onUserData,
      axios.post,
    );

    ha = [sessionInit, sessionSet, gauth.init, gauth.resume, sessionInfo, ...handlerArray];
  } else {
    ha = [sessionInit, sessionSet, sessionInfo, ...handlerArray];
  }

  const dbProvider = dbProviderCtor({connectionString: settings.dbConnectionString});

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
        handleServerError(res, e as Error);
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
      ws = wsInit(wsHandlerRegistry, server, settings, sessionInit, dbProvider, tuidFactory, wsOnConnectHandler, wsOnCloseHandler);
    }
  }
  return {server, ws};
}
