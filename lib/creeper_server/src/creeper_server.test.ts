import {creeperServerCtorCtor} from "./index";
import {starRepositoryServerFactory} from "@nereid/nodecore";
import assert from "assert";
import WebSocket from "ws";
import sinon from "sinon";
import {serializableType, stateModifierFunctionType} from "@nereid/anycore";
import {Draft} from "immer";
import {webSocketModuleType} from "@nereid/nodesrv";

describe("creeperServer", () => {
  it("basics", async () => {
    let i = 0;
    const creeperEventRegistry = {
      updateV0(eventParams: serializableType, state: Draft<Record<string, serializableType>>) {
        state[++i] = eventParams;
      }
    } as Readonly<Record<string, stateModifierFunctionType>>;

    // starRepositoryServerFactory could be stubbed to avoid some of the complexity?
    const creeperServerCtor = creeperServerCtorCtor(
      () => 1555,
      starRepositoryServerFactory,
      creeperEventRegistry
    );

    let module: webSocketModuleType | undefined;
    const creeperServer = creeperServerCtor({addModule: (m: webSocketModuleType) => module = m} as any);
    assert(module);

    const call1 = sinon.stub();
    call1.resolves(true);
    const call2 = sinon.stub();
    call2.resolves(true);
    const call3 = sinon.stub();
    call3.resolves(true);

    const wsCtx1: any = {sessionId: "1", ws: {readyState: WebSocket.OPEN, close: sinon.stub()}, call: call1};
    const wsCtx2: any = {sessionId: "2", ws: {readyState: WebSocket.OPEN, close: sinon.stub()}, call: call2};
    const wsCtx3: any = {sessionId: "1", ws: {readyState: WebSocket.OPEN, close: sinon.stub()}, call: call3};
    assert.deepStrictEqual(await module.calls.getState(wsCtx1, {}), {state: {}, stateSignature: "2e1472b57af294d1"});
    assert.strictEqual(creeperServer._.ctxWsSubs["1"], wsCtx1);
    assert.deepStrictEqual(await module.calls.getState(wsCtx2, {}), {state: {}, stateSignature: "2e1472b57af294d1"});
    assert.strictEqual(creeperServer._.ctxWsSubs["2"], wsCtx2);
    const params1 = {
      "event": {
        "name": "updateV0",
        "params": {"name": "bob", "location": "/home"}
      },
      "clientId": "AX_dP5bYsKdZdh5PWO1nRQ",
      "eventId": "AX_dP5cGQZn0B1sRtsPseQ",
      "eventRegistrySignature": creeperServer.repo.eventRegistrySignature
    };
    assert.deepStrictEqual(await module.calls.commit(wsCtx1, params1), true);

    const event1 = {
      event: {
        name: 'updateV0',
        params: {name: 'bob', location: '/home', loginId: '1', lastSeen: 1555},
      },
      clientId: 'AX_dP5bYsKdZdh5PWO1nRQ',
      eventId: 'AX_dP5cGQZn0B1sRtsPseQ',
      eventRegistrySignature: '63ec5bfb86cbb908',
      preMergeSignature: '2e1472b57af294d1',
      postMergeSignature: 'c74d087bb9d4677f'
    };
    sinon.assert.calledWithExactly(call1, "creeper", "rebase", event1);
    sinon.assert.calledWithExactly(call2, "creeper", "rebase", event1);
    sinon.assert.notCalled(call3);

    call1.reset();
    call2.reset();
    call2.resolves(true);

    wsCtx2.ws.readyState = WebSocket.CLOSING;
    assert.deepStrictEqual(await module.calls.getState(wsCtx3, {}), {
      state: {
        "1": {
          "lastSeen": 1555,
          "location": "/home",
          "name": "bob",
          "loginId": "1"
        }
      },
      stateSignature: 'c74d087bb9d4677f'
    });
    assert.strictEqual(creeperServer._.ctxWsSubs["1"], wsCtx3);

    const params2 = {
      "event": {
        "name": "updateV0",
        "params": {"name": "bob", "location": "/", "lastSeen": 1555, "loginId": "1"}
      },
      "clientId": "AX_dP5bYsKdZdh5PWO1nRQ",
      "eventId": "AX_dP5cGQZn0B1sRtsPseZ",
      "eventRegistrySignature": creeperServer.repo.eventRegistrySignature
    };
    assert.deepStrictEqual(await module.calls.commit(wsCtx3, params2), true);
    const event2 = {
      event: {
        name: 'updateV0',
        params: {name: 'bob', location: '/', lastSeen: 1555, loginId: '1'},
      },
      clientId: 'AX_dP5bYsKdZdh5PWO1nRQ',
      eventId: 'AX_dP5cGQZn0B1sRtsPseZ',
      eventRegistrySignature: '63ec5bfb86cbb908',
      preMergeSignature: 'c74d087bb9d4677f',
      postMergeSignature: '026a4a4f53b39140'
    };
    sinon.assert.notCalled(call1);
    sinon.assert.notCalled(call2);
    sinon.assert.calledWithExactly(call3, "creeper","rebase", event2)
    assert.strictEqual(creeperServer._.ctxWsSubs["1"], wsCtx3);
    assert.strictEqual(creeperServer._.ctxWsSubs["2"], undefined);

    assert.strictEqual(await module.calls.commit(wsCtx2, {}), false);
  });
});
