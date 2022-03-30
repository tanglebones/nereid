import {Draft} from "immer";
import {serializableType, stateModifierFunctionType} from "@nereid/anycore";

export const creeperEventRegistryCtor = (nowMs: () => number) => {
  const updateV0 = (eventParams: serializableType, state: Draft<Record<string, serializableType>>) => {
    const p = eventParams as { login_id: string, name?: string, location?: string, lastSeen?: number};
    if (!p.login_id) {
      return;
    }
    if (p.location) {
      p.lastSeen = nowMs();
      state[p.login_id] ??={};
      const s = (state[p.login_id] ?? {}) as Record<string, serializableType>;
      s.location =  p.location;
      s.name = p.name;
      s.lastSeen = p.lastSeen;
    } else {
      delete state[p.login_id];
    }
  };

  return {
    updateV0,
  } as Readonly<Record<string, stateModifierFunctionType>>;
}
