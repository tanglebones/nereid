import assert from "assert";
import {promiseStateCtor} from "./promise_state";

describe("PromiseState", () => {
  it("resolved path", async () => {
    let pr: (x: number) => void = (_) => {
    };

    const p: Promise<number> = new Promise((r) => {
      pr = r;
    });

    const ps = promiseStateCtor(p);

    assert(ps.isPending);
    assert(!ps.isResolved);
    assert(!ps.isRejected);

    pr(33);

    assert.strictEqual(await ps, 33);

    assert(!ps.isPending);
    assert(ps.isResolved);
    assert(!ps.isRejected);
  });

  it("rejected path", async () => {
    let pr: (_: Error) => void = (_) => {
    };

    const p: Promise<number> = new Promise((_, r) => {
      pr = r;
    });
    const ps = promiseStateCtor(p);

    assert(ps.isPending);
    assert(!ps.isResolved);
    assert(!ps.isRejected);

    pr(new Error("44"));

    try {
      await ps;
      assert.fail("unreachable");
    } catch (e) {
      assert.strictEqual((e as Error)?.message, "44");
    }

    assert(!ps.isPending);
    assert(!ps.isResolved);
    assert(ps.isRejected);

  });
});
