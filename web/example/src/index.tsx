import React from 'react';
import {createRoot} from 'react-dom/client';
import {tuidFactory, webSocketFactoryCtor, webSocketHandlerType, webSocketType} from "@nereid/webcore";
import {echo} from "./web_socket/echo";
import {creeperClient, creeperClientType, wsCreeperClientHandlerRegistry} from "@nereid/creeper_client";
import {Frame} from "./frame";
import {serializableType} from "@nereid/anycore";

const wsHostName = (subdomain: string) => {
  const hostParts = window.location.hostname.split('.').reverse();
  return `${subdomain}.${hostParts[1]}.${hostParts[0]}`;
};

const webSocketHandlerRegistry: Readonly<Record<string, webSocketHandlerType>> = {
  'echo': echo,
  ...wsCreeperClientHandlerRegistry, // todo: dynamically add to webSocket.
};

const webSocketFactory = webSocketFactoryCtor(tuidFactory, window.setTimeout, window.clearTimeout);
const webSocket = webSocketFactory(
  wsHostName('api'),
  webSocketHandlerRegistry,
);

// todo: merge into client
const creeperApiCtor = (webSocket: webSocketType, creeperClient: creeperClientType) => {
  const repo = creeperClient.repo;
  let name = '-';
  return {
    async syncState() {
      const {
        state
      } = (await webSocket.call('creeper.getState', {})) as { state: serializableType };
      repo.serverState = state;
    },
    async updateLocation() {
      const localCommit = repo.localCommit('updateV0', {
        name,
        location: window.location.pathname
      });
      await webSocket.call('creeper.commit', localCommit);
    },
    get name() {
      return name;
    },
    set name(value: string) {
      name = value;
    },
  };
};

const creeperApi = creeperApiCtor(webSocket, creeperClient);

// temp code to test ws connection
(async () => {
  console.log(await webSocket.call('echo', {test: 1}));
  await creeperApi.syncState();
  await creeperApi.updateLocation();
  console.log(creeperClient.repo.localState);
})().catch(console.error);

const root = createRoot(document.getElementById('root') as Element);
root.render(<Frame/>);
