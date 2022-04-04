import {stateModifierFunctionType} from "@nereid/anycore";
import sinon from "sinon";
import {creeperClientCtorCtor} from "./creeper_client";
import assert from "assert";
import {webSocketModuleType} from "@nereid/webcore";

describe("creeper_client", () => {
  it("basics", async () => {
    const creeperEventRegistry = {} as Readonly<Record<string, stateModifierFunctionType>>;
    const repo = {
      serverState: {},
      localState: {},
      onRebase: sinon.stub(),
      serverStateSignature: "sig1",
      localCommit: sinon.stub(),
    };
    const starRepositoryCloneFactory = sinon.stub();
    starRepositoryCloneFactory.returns(repo);

    const onRebaseCb = sinon.stub();
    const creeperClientCtor = creeperClientCtorCtor(starRepositoryCloneFactory, creeperEventRegistry);
    let module: webSocketModuleType | undefined;
    const webSocketRpc = {
      addModule: (m: webSocketModuleType) => module = m,
      call: sinon.stub(),
    };
    const creeperClient = creeperClientCtor(webSocketRpc as any);
    creeperClient.onRebase(onRebaseCb);
    assert(module);

    assert.strictEqual(await module.calls.setState({a: 1}), true);
    assert.deepStrictEqual(repo.serverState, {a: 1});
    assert.strictEqual(await module.calls.rebase({x: 1}), true);
    sinon.assert.calledWithExactly(repo.onRebase, {x: 1});

    sinon.assert.called(onRebaseCb);

    creeperClient.name = 'bob';
    assert.strictEqual(creeperClient.name, 'bob');

    webSocketRpc.call.resolves({state: {x: 2}, stateSignature: "sig1"});
    await creeperClient.syncState();

    sinon.assert.calledWithExactly(webSocketRpc.call, "creeper", "getState", {}, undefined);
    assert.deepStrictEqual(creeperClient.serverState, {x: 2});

    webSocketRpc.call.resolves({state: {x: 3}, stateSignature: "sig2"});
    try {
      await creeperClient.syncState();
      assert.fail("should have thrown");
    } catch {
    }

    webSocketRpc.call.reset();
    webSocketRpc.call.resolves(true);

    repo.localCommit.returns({event: {name: 'updateV0', params: 'commit'}});

    assert(await creeperClient.updateLocation());
    sinon.assert.calledWithExactly(webSocketRpc.call, "creeper", "commit", {
      event: {
        name: 'updateV0',
        params: 'commit'
      }
    }, undefined);

    assert.deepStrictEqual(creeperClient.localState, {});
  });
});
