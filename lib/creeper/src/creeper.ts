import {Draft} from "immer";
import {serializableType, stateModifierFunctionType} from "@nereid/anycore";

export const creeperEventRegistryCtor = () => {
  const updateV0 = (eventParams: serializableType, state: Draft<Record<string, serializableType>>) => {
    const p = eventParams as { loginId: string, name?: string, location?: string, lastSeen?: number};
    if (!p.loginId) {
      return;
    }
    if (p.location) {
      state[p.loginId] ??={};
      const s = state[p.loginId] as Record<string, serializableType>;
      s.location =  p.location;
      s.name = p.name;
      s.lastSeen = p.lastSeen;
    } else {
      delete state[p.loginId];
    }
  };

  return {
    updateV0,
  } as Readonly<Record<string, stateModifierFunctionType>>;
}
