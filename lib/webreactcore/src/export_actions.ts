import {actionsType} from "./react.type";

export const exportActions = (actions: actionsType | undefined, given: actionsType) => {
  if (actions) {
    Object.assign(actions, given);
  }
};

