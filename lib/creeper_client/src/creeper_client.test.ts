import {stateModifierFunctionType} from "@nereid/anycore";
import sinon from "sinon";
import {creeperClientCtor} from "./creeper_client";
import assert from "assert";

describe("creeper_client", () => {
  it("basics", async () => {
    const creeperEventRegistry = {} as Readonly<Record<string, stateModifierFunctionType>>;
    const repo = {serverState: {}, localState: {}, onRebase: sinon.stub()};
    const starRepositoryCloneFactory = sinon.stub();
    starRepositoryCloneFactory.returns(repo);

    const creeperClient = creeperClientCtor(starRepositoryCloneFactory, creeperEventRegistry);

    assert.strictEqual(await creeperClient.wsSetState({a:1}), true);
    assert.deepStrictEqual(repo.serverState, {a:1});
    assert.strictEqual(await creeperClient.wsRebase({x:1}), true);
    sinon.assert.calledWithExactly(repo.onRebase, {x:1});
  });
});
