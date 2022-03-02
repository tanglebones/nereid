import assert from "assert";
import {entitiesOrderedByKey, entitiesOrderedByKeyReversed} from "./entries_ordered_by_key";


describe("entriesOrderedByKey", () => {
  const obj = {m: 1, a: 2, z: 3};
  it("forward", () => {
    assert.deepStrictEqual(entitiesOrderedByKey(Object.entries(obj)), [['a', 2], ['m', 1], ['z', 3]]);
    assert.deepStrictEqual(entitiesOrderedByKey([['m', 1], ['a', 2], ['m', 1], ['z', 3]]), [['a', 2], ['m', 1], ['m', 1], ['z', 3]]);
  });
  it("forward", () => {
    assert.deepStrictEqual(entitiesOrderedByKeyReversed(Object.entries(obj)), [['z', 3], ['m', 1], ['a', 2]]);
    assert.deepStrictEqual(entitiesOrderedByKeyReversed([['m', 1], ['z', 3], ['m', 1], ['a', 2]]), [['z', 3], ['m', 1], ['m', 1], ['a', 2]]);
  });
});
