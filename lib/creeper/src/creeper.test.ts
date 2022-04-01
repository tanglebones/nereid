import {creeperEventRegistryCtor} from "./index";
import {produce} from "immer";
import assert from "assert";

describe("creeperEventRegistry", () => {
  it("updateV0", () => {
    const creeperEventRegistry = creeperEventRegistryCtor();

    const state = produce({}, x => x);
    const s1 = produce(state, x => creeperEventRegistry['updateV0']({loginId: '123', name: 'bob', location: '/', lastSeen: 1500}, x));
    assert.deepStrictEqual(produce(state, x => creeperEventRegistry['updateV0']({
      name: 'bob',
      location: '/ignored',
      lastSeen: 1500,
    }, x)), {});

    assert.deepStrictEqual(produce({'123': {name: 'bob', 'location': '/', lastSeen: 1500}}, x => x), s1);
    const s2 = produce(s1, x => creeperEventRegistry['updateV0']({loginId: '123'}, x));

    assert.deepStrictEqual(produce({}, x => x), s2);
  });
});
