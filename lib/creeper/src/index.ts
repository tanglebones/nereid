import {Draft} from "immer";
import {serializableType, stateModifierFunctionType} from "@nereid/anycore";

const updateV0 = (eventParams: serializableType, state: Draft<Record<string, serializableType>>) => {
  const p = eventParams as { name: string, location?: string };
  if (p.location) {
    state[p.name] = p.location;
  } else {
    delete state[p.name];
  }
};

export const creeperEventRegistry = {updateV0} as Readonly<Record<string, stateModifierFunctionType>>;
