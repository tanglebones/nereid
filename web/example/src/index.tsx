import React from 'react';
import {render} from 'react-dom';
import {Counter} from "@nereid/webreactexample";
import {creeper, webSocket} from "./bootstrap";

const Application = () => (
  <div>
    <h1>Application</h1>
    <Counter/>
  </div>
);

console.log("here");

(async () => {
  console.log(await webSocket.call('echo', {test: 1}));
  await creeper.set(await webSocket.call('creeper.get', {}));
  await webSocket.call('creeper.update', {name: 'bob', location: '/home'})
})();

render(<Application/>, document.getElementById('root'));
