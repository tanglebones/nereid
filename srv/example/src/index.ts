import {contentHandlerType, serverSettingsType} from "@nereid/nodesrv/dist/server.type";
import {appDbProvider, exit, serverFactory, staffDbProvider} from "./bootstrap";
import {main} from "@nereid/nodemain";
import {helloHandler} from "./hello_handler";

main(async () => {
  // todo read from env
  const appSettings: serverSettingsType = {
    port: 8080,
    host: '127.0.0.1',
    schema: 'http',
    appUrl: 'http://api.example.xxx',
  };

  const appHandlerArray = [helloHandler] as contentHandlerType[];

  serverFactory(
    appDbProvider,
    appSettings,
    appHandlerArray
  );

  // todo read from env
  const staffSettings: serverSettingsType = {
    port: 8800,
    host: '127.0.0.1',
    schema: 'http',
    appUrl: 'http://api.example.xxx',
  };

  const staffHandlerArray = [helloHandler] as contentHandlerType[];

  serverFactory(
    staffDbProvider,
    staffSettings,
    staffHandlerArray
  );

  await exit.exitPromise;
});
