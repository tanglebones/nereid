import {actionsType, exportActions, reactType} from "@nereid/webreactcore";

export const counterCtor = (React: reactType) =>
  (actions?: actionsType) => {
    const [count, setCount] = React.useState(0);

    const onClick = () => {
      setCount(count + 1);
    };

    exportActions(actions, {onClick});

    return <div>
      <p>You clicked {count} times</p>
      <button onClick={onClick}>
        Click me
      </button>
    </div>
      ;
  };

