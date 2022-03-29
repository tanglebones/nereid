import {Draft} from "immer";
import {serializableType, stateModifierFunctionType} from "@nereid/anycore";

const updateV0 = (eventParams: serializableType, state: Draft<Record<string, serializableType>>) => {
  const p = eventParams as { login_id: string, name?: string, location?: string };
  if (!p.login_id) {
    return;
  }
  if (p.location) {
    state[p.login_id] = {location: p.location, name: p.name};
  } else {
    delete state[p.login_id];
  }
};

export const creeperEventRegistry = {updateV0} as Readonly<Record<string, stateModifierFunctionType>>;
