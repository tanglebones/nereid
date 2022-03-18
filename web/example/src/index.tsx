import React from 'react';
import {render} from 'react-dom';
import {Counter} from "@nereid/webreactexample";

const Application = () => (
  <div>
    <h1>Application</h1>
    <Counter/>
  </div>
);

render(<Application/>, document.getElementById('root'));
