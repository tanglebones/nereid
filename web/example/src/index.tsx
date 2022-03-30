import React from 'react';
import {createRoot} from 'react-dom/client';
import {Counter} from "@nereid/webreactexample";
import {creeper, tuidFactory, webSocket} from "./bootstrap";

const Application = () => (
  <div>
    <h1>Application</h1>
    <Counter/>
  </div>
);

(async () => {
  console.log(await webSocket.call('echo', {test: 1}));
  const repo = creeper.repo;
  repo.serverState = await webSocket.call('creeper.getState', {});

  await webSocket.call('creeper.commit', repo.localCommit('updateV0', {
    login_id: tuidFactory(),
    name: 'bob',
    location: '/home'
  }));
})().catch(console.error);

const root = createRoot(document.getElementById('root') as Element);
root.render(<Application/>);
