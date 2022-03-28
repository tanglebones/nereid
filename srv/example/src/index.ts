import {contentHandlerType, serverSettingsType} from "@nereid/nodesrv";
import {appDbProvider, exit, serverFactory} from "./bootstrap";
import {main} from "@nereid/nodemain";
import {helloHandler} from "./hello_handler";
import {wsHandlerRegistry, wsOnCloseHandler, wsOnConnectHandler} from "./web_socket";

const portMapping = require("../port_mapping.json");

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
