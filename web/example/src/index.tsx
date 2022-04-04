import React from 'react';
import {createRoot} from 'react-dom/client';
import {webSocketFactory} from "@nereid/webcore";
import {creeperClientCtor} from "@nereid/creeper_client";
import {Frame} from "./frame";

const webSocketHostName = (subdomain: string) => {
  const hostParts = window.location.hostname.split('.').reverse();
  return `${subdomain}.${hostParts[1]}.${hostParts[0]}`;
};

const webSocketRpc = webSocketFactory(webSocketHostName('api'), console.error);
const creeperClient = creeperClientCtor(webSocketRpc);

creeperClient.onRebase(async () => {
  console.log('onRebase', creeperClient.localState);
})

webSocketRpc.onConnect(async () => {
// temp code to test ws connection
  try {
    creeperClient.name = 'bob';
    await creeperClient.syncState();
    await creeperClient.updateLocation();
    console.log(creeperClient.localState);
  } catch (e) {
    console.error(e);
  }
});

const root = createRoot(document.getElementById('root') as Element);
root.render(<Frame/>);
