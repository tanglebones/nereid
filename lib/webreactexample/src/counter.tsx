import React from 'react';
import {actionsType, reactType} from "./r.type";

export const counterCtor = (React: reactType) =>
  (actions?: actionsType) => {
    const [count, setCount] = React.useState(0);

    actions = Object.assign(actions ?? {}, {
      onClick() {
        setCount(count + 1);
      }
    });

    return <div>
      <p>You clicked {count} times</p>
      <button onClick={actions.onClick}>
        Click me
      </button>
    </div>
      ;
  };

export const Counter = counterCtor(React);
