import assert from 'assert';
import {starRepositoryCloneFactoryCtor, starRepositoryServerFactory, stateModifierFunctionType} from './star_repo';
import {serializableType} from './serialize';
import {Draft} from 'immer';

let tuidId = 0;
const tuidFactory = () => (++tuidId).toString(16).padStart(32, '0');

describe('starRepo', () => {
  const append = (eventParams: serializableType, state: Draft<Record<string, serializableType>>) => {
    Object.assign(state, eventParams);
    if ((eventParams as Record<string, boolean>).exception) {
      throw new Error("Some Error");
    }
  };

  const remove = (eventParams: serializableType, state: Draft<Record<string, serializableType>>) => {
    const params = eventParams as Record<string, unknown>;
    const what = params?.['what'];
    if (typeof what === 'string' && state) {
      delete state[what as string];
    }
  };

  it('multi-client example', () => {
    const eventRegistry = {append, remove} as Readonly<Record<string, stateModifierFunctionType>>;
    const errors: { error: string, details: Record<string, unknown> }[] = [];

    function onError(error: string, details: Record<string, unknown>): void {
      errors.push({error, details});
    }

    const starRepositoryCloneFactory = starRepositoryCloneFactoryCtor(tuidFactory);

    const initialState = {};
    const srServer = starRepositoryServerFactory(eventRegistry, onError, initialState);

    const srClient0 = starRepositoryCloneFactory(eventRegistry, onError, initialState);
    const srClient1 = starRepositoryCloneFactory(eventRegistry, onError, initialState);
    const srClient2 = starRepositoryCloneFactory(eventRegistry, onError, initialState);

    // send some commands to the registry
    const c0cm0 = srClient0.localCommit('append', {a: 1});
    assert(c0cm0);
    const c1cm0 = srClient1.localCommit('append', {b: 2});
    assert(c1cm0);
    const c2cm0 = srClient2.localCommit('append', {c: 3});
    assert(c2cm0);
    const c2cm1 = srClient2.localCommit('remove', {what: 'c'});
    assert(c2cm1);

    assert.strictEqual(srClient0.pendingCount, 1);
    assert.strictEqual(srClient1.pendingCount, 1);
    assert.strictEqual(srClient2.pendingCount, 2);

    assert.deepStrictEqual(srClient0.localState, {a: 1});
    assert.deepStrictEqual(srClient0.serverState, {});
    assert.deepStrictEqual(srClient1.localState, {b: 2});
    assert.deepStrictEqual(srClient1.serverState, {});
    assert.deepStrictEqual(srClient2.localState, {});
    assert.deepStrictEqual(srClient2.serverState, {});

    // c2cm0 reaches server first: append {c:3}
    const scm0 = srServer.mergeCommit(c2cm0);
    assert(scm0);

    // scm0 sent back to each client
    srClient0.onRebase(scm0);
    srClient1.onRebase(scm0);
    srClient2.onRebase(scm0);

    assert.deepStrictEqual(srClient0.localState, {a: 1, c: 3});
    assert.deepStrictEqual(srClient0.serverState, {c: 3});
    assert.deepStrictEqual(srClient1.localState, {b: 2, c: 3});
    assert.deepStrictEqual(srClient1.serverState, {c: 3});
    assert.deepStrictEqual(srClient2.localState, {});
    assert.deepStrictEqual(srClient2.serverState, {c: 3});

    // c0cm0 next: append {a:1}
    const scm1 = srServer.mergeCommit(c0cm0);
    assert(scm1);

    // scm0 sent back to each client
    srClient0.onRebase(scm1);
    srClient1.onRebase(scm1);
    srClient2.onRebase(scm1);

    assert.deepStrictEqual(srClient0.localState, {a: 1, c: 3});
    assert.deepStrictEqual(srClient0.serverState, {a: 1, c: 3});
    assert.deepStrictEqual(srClient1.localState, {a: 1, b: 2, c: 3});
    assert.deepStrictEqual(srClient1.serverState, {a: 1, c: 3});
    assert.deepStrictEqual(srClient2.localState, {a: 1});
    assert.deepStrictEqual(srClient2.serverState, {a: 1, c: 3});

    // c1cm0 next: append {b:1}
    const scm2 = srServer.mergeCommit(c1cm0);
    assert(scm2);

    // scm0 sent back to each client
    srClient0.onRebase(scm2);
    srClient1.onRebase(scm2);
    srClient2.onRebase(scm2);

    assert.deepStrictEqual(srClient0.localState, {b: 2, a: 1, c: 3});
    assert.deepStrictEqual(srClient0.serverState, {b: 2, a: 1, c: 3});
    assert.deepStrictEqual(srClient1.localState, {a: 1, b: 2, c: 3});
    assert.deepStrictEqual(srClient1.serverState, {b: 2, a: 1, c: 3});
    assert.deepStrictEqual(srClient2.localState, {b: 2, a: 1});
    assert.deepStrictEqual(srClient2.serverState, {b: 2, a: 1, c: 3});

    // c2cm1 next: remove {what:c}
    const scm3 = srServer.mergeCommit(c2cm1);
    assert(scm3);

    // scm0 sent back to each client
    srClient0.onRebase(scm3);
    srClient1.onRebase(scm3);
    srClient2.onRebase(scm3);

    assert.deepStrictEqual(srClient0.localState, {b: 2, a: 1});
    assert.deepStrictEqual(srClient0.serverState, {b: 2, a: 1});
    assert.deepStrictEqual(srClient1.localState, {a: 1, b: 2});
    assert.deepStrictEqual(srClient1.serverState, {b: 2, a: 1});
    assert.deepStrictEqual(srClient2.localState, {b: 2, a: 1});
    assert.deepStrictEqual(srClient2.serverState, {b: 2, a: 1});

    assert.strictEqual(srClient1.serverStateSignature, '125600492fb0dec7');
    srClient1.serverState = {};
    assert.strictEqual(srClient1.serverStateSignature, '2e1472b57af294d1');
    assert.strictEqual(srClient1.clientId, '00000000000000000000000000000002')

    assert.strictEqual(0, errors.length);

    const eventRegistrySignature = '5ed83c298a4eaafc';
    const preMergeSignature = '125600492fb0dec7';
    srClient0.onRebase({eventRegistrySignature: 'nope'});
    srClient0.onRebase({eventRegistrySignature})
    srClient0.onRebase({eventRegistrySignature, preMergeSignature})
    srClient0.onRebase({eventRegistrySignature, preMergeSignature, event: {}})
    srClient0.onRebase({eventRegistrySignature, preMergeSignature, event: {name: "nope"}});
    srClient0.onRebase({eventRegistrySignature, preMergeSignature, event: {name: "append", params: {d: 1}}});
    srClient0.onRebase({
      eventRegistrySignature,
      preMergeSignature,
      event: {name: "append", params: {exception: true}}
    });
    srClient0.localCommit('nope', {});

    assert.deepStrictEqual(
      errors,
      [
        {
          "details": {
            "localSignature": "5ed83c298a4eaafc",
            "remoteSignature": "nope",
          },
          "error": "ON_REMOTE_EVENT_REGISTRY_SIGNATURE_MISMATCH"
        },
        {
          "details": {
            "preMergeSignature": undefined,
            "signature": "125600492fb0dec7"
          },
          "error": "ON_REMOTE_STATE_PRE_SIGNATURE_MISMATCH"
        },
        {
          "details": {
            "postMergeSignature": undefined,
            "signature": "1c99c7ee8735e782"
          },
          "error": "ON_REMOTE_STATE_POST_SIGNATURE_MISMATCH"
        },
        {
          "details": {
            "exception": 'Error: Some Error'
          },
          "error": "ON_REMOTE_EXCEPTION"
        },
        {
          "details": {
            "local": true,
            "name": "nope"
          },
          "error": "NOT_IN_EVENT_REGISTRY"
        }
      ]
    );

    errors.length = 0;

    assert.deepStrictEqual(srServer.state, {a:1,b:2});
    assert.strictEqual(srServer.stateSignature, "125600492fb0dec7");

    srServer.mergeCommit({eventRegistrySignature: 'nope'});
    srServer.mergeCommit({eventRegistrySignature});
    srServer.mergeCommit({eventRegistrySignature, event: {}});
    srServer.mergeCommit({eventRegistrySignature, event: {name: "nope"}});
    srServer.mergeCommit({
      eventRegistrySignature, event: {name: "append", params: {exception: true}}
    });

    assert.deepStrictEqual(srServer.state, {a:1,b:2});
    assert.strictEqual(srServer.stateSignature, "125600492fb0dec7");

    assert.deepStrictEqual(
      errors,
      [
        {
          "details": {
            "localSignature": "5ed83c298a4eaafc",
            "remoteSignature": "nope",
          },
          "error": "ON_REMOTE_EVENT_REGISTRY_SIGNATURE_MISMATCH"
        },
        {
          "details": {
            "exception": "Error: Some Error"
          },
          "error": "ON_REMOTE_EXCEPTION"
        }
      ]
    );
  });
})
;

