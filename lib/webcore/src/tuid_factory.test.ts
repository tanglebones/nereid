import assert from "assert";
import {tuidFactoryCtor} from "./tuid_factory";
import {randomFillSync} from "crypto";
import {DateTime} from "luxon";

const fakeWindow = {
  crypto: {
    getRandomValues(array: Uint8Array) {
      randomFillSync(array)
    }
  }
} as any;

describe('tuidFactory', () => {
  const tuidFactory = tuidFactoryCtor(fakeWindow, () => DateTime.now().toUTC().toMillis());
  it("basics", () => {
    const tuid = tuidFactory();
    assert(tuid.startsWith("A"));
    assert.strictEqual(22, tuid.length);
  });
});
