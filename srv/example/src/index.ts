import {contentHandlerType, dbProviderCtor, exitCtor, serverFactoryCtor, serverSettingsType} from "@nereid/nodesrv";
import {main} from "@nereid/nodemain";
import {helloHandler} from "./hello_handler";
import {wsHandlerRegistry, wsOnCloseHandler, wsOnConnectHandler} from "./web_socket";
import {clearInterval} from "timers";
import {createServer} from "http";
import {eventLoopHealthMonitorCtor, tuidFactory} from "@nereid/nodecore";
import {cancellationTokenFactory, nowMs} from "@nereid/anycore";

const portMapping = require("../port_mapping.json");

const appConnectionString = process.env.PGDB_URL_APP;
if (!appConnectionString) {
  throw new Error("PGDB_URL_APP not set");
}

const staffConnectionString = process.env.PGDB_URL_APP;
if (!staffConnectionString) {
  throw new Error("PGDB_URL_APP not set");
}

eventLoopHealthMonitorCtor(
  nowMs,
  setInterval,
  clearInterval,
  console.error,
  +(process.env.NODE_EVENT_LOOP_HEALTH_MONITOR_INTERVAL || '10000'),
  +(process.env.NODE_EVENT_LOOP_HEALTH_MONITOR_MAX_DRIFT || '100'),
);

const exit = exitCtor(process, cancellationTokenFactory);
const appDbProvider = dbProviderCtor({connectionString: appConnectionString, application_name: 'ep_app'});
const serverFactory = serverFactoryCtor(createServer, setInterval, tuidFactory);

main(async () => {
  // todo read from env
  const appSettings: serverSettingsType = {
    port: portMapping.api,
    host: '127.0.0.1',
    schema: 'http',
    appUrl: 'http://api.example.xxx',
    // session: {
    //   enabled: true,
    //   cookieName: 'AX-3qDKkQMKHQHwswIWNvw',
    //   expirySeconds: 600,
    //   expiryIntervalMs: 60,
    // }
  };

  const appHandlerArray = [helloHandler] as contentHandlerType[];

  serverFactory(
    appDbProvider,
    appSettings,
    appHandlerArray,
    wsHandlerRegistry,
    wsOnConnectHandler,
    wsOnCloseHandler,
  );

  await exit.exitPromise;
});
