import React from 'react';
import {render} from 'react-dom';
import {Counter} from "@nereid/webreactexample";
import {ws} from "./ws";

const Application = () => (
  <div>
    <h1>Application</h1>
    <Counter/>
  </div>
);

console.log("here");

(async () => {
  console.log(await ws.call('echo', {test: 1}));
})();

render(<Application/>, document.getElementById('root'));
