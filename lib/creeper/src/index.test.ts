import {creeperEventRegistryCtor} from "./index";
import {produce} from "immer";
import assert from "assert";

describe("creeperEventRegistry", () => {
  it("updateV0", () => {
    const nowMs = () => 123;
    const creeperEventRegistry = creeperEventRegistryCtor(nowMs);

    const state = produce({}, x => x);
    const s1 = produce(state, x => creeperEventRegistry['updateV0']({login_id: '123', name: 'bob', location: '/'}, x));

    assert.deepStrictEqual(produce({'123': {name: 'bob', 'location': '/', lastSeen: 123}}, x => x), s1);
    const s2 = produce(s1, x => creeperEventRegistry['updateV0']({login_id: '123'}, x));

    assert.deepStrictEqual(produce({}, x => x), s2);
  });
});
