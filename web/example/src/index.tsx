import React from 'react';
import {createRoot} from 'react-dom/client';
import {Counter} from "@nereid/webreactexample";
import {tuidFactory, webSocketFactoryCtor, webSocketHandlerType} from "@nereid/webcore";
import {echo} from "./web_socket/echo";
import {creeperClient, wsCreeperClientHandlerRegistry} from "@nereid/creeper_client";

const wsHostName = (subdomain: string) => {
  const hostParts = window.location.hostname.split('.').reverse();
  return `${subdomain}.${hostParts[1]}.${hostParts[0]}`;
};

const webSocketHandlerRegistry: Readonly<Record<string, webSocketHandlerType>> = {
  'echo': echo,
  ...wsCreeperClientHandlerRegistry,
};

const webSocketFactory = webSocketFactoryCtor(tuidFactory, window.setTimeout, window.clearTimeout);
const webSocket = webSocketFactory(
  wsHostName('api'),
  webSocketHandlerRegistry,
);

const Application = () => (
  <div>
    <h1>Application</h1>
    <Counter/>
  </div>
);

(async () => {
  console.log(await webSocket.call('echo', {test: 1}));
  const repo = creeperClient.repo;
  repo.serverState = await webSocket.call('creeper.getState', {});

  const localCommit = repo.localCommit('updateV0', {
    name: 'bob',
    location: '/home'
  });
  await webSocket.call('creeper.commit', localCommit);
})().catch(console.error);

const root = createRoot(document.getElementById('root') as Element);
root.render(<Application/>);
