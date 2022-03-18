import * as assert from 'assert';
import {starRepositoryCtorCtor, stateModifierFunctionType} from './star_repo';
import {serializableType} from './serialize';
import {Draft} from 'immer';
import {tuidForTestingFactoryCtor} from "@nereid/nodecore";

describe('starRepo', () => {
  it('basics', async () => {
    function append(eventParams: serializableType, state: Draft<Record<string, serializableType>>): void {
      Object.assign(state, eventParams);
    }

    function remove(eventParams: serializableType, state: Draft<Record<string, serializableType>>): void {
      const params = eventParams as Record<string, unknown>;
      const what = params?.['what'];
      if (typeof what === 'string' && state) {
        delete state[what as string];
      }
    }

    function exception(_eventParams: serializableType, _state: Draft<Record<string, serializableType>>): void {
      throw new Error('oops');
    }

    const eventRegistry = {append, remove, exception} as Readonly<Record<string, stateModifierFunctionType>>;

    const messages: string[] = [];

    async function onLocal(message: string): Promise<void> {
      messages.push(message);
    }

    const errors: { error: string, details: Record<string, unknown> }[] = [];

    function onError(error: string, details: Record<string, unknown>): void {
      errors.push({error, details});
    }

    const src = starRepositoryCtorCtor(tuidForTestingFactoryCtor(100));
    const sr = src(
      eventRegistry,
      onLocal,
      onError,
    );

    assert.strictEqual(sr.clientId, '00000000006400000000000000000000');

    // send some commands to the registry
    await sr.apply('append', {a: 1});
    await sr.apply('append', {b: 2});
    await sr.apply('append', {c: 3});
    await sr.apply('delete', {what: 'c'}); // not a valid command
    await sr.apply('remove', {what: 'c'});

    // the actual messages sent to the registry
    assert.deepStrictEqual(messages, [
      '{"clientId":"00000000006400000000000000000000","event":{"name":"append","params":{"a":1}},"eventId":"00000000006500000000000000000000","eventRegistrySignature":"438b04a2f67f6943","postEventSignature":"ca0b885a32fc8b48"}',
      '{"clientId":"00000000006400000000000000000000","event":{"name":"append","params":{"b":2}},"eventId":"00000000006600000000000000000000","eventRegistrySignature":"438b04a2f67f6943","postEventSignature":"125600492fb0dec7"}',
      '{"clientId":"00000000006400000000000000000000","event":{"name":"append","params":{"c":3}},"eventId":"00000000006700000000000000000000","eventRegistrySignature":"438b04a2f67f6943","postEventSignature":"424b61ff59dba18f"}',
      '{"clientId":"00000000006400000000000000000000","event":{"name":"remove","params":{"what":"c"}},"eventId":"00000000006800000000000000000000","eventRegistrySignature":"438b04a2f67f6943","postEventSignature":"125600492fb0dec7"}',
    ]);

    // and one error
    assert.deepStrictEqual(errors, [
      {
        error: 'NOT_IN_EVENT_REGISTRY',
        details: {name: 'delete', local: true},
      },
    ]);

    // state based on our local commands, with 4 commands waiting for acks
    assert.deepStrictEqual(sr.state, {a: 1, b: 2});
    assert.strictEqual(sr.stateSignature, '125600492fb0dec7');
    assert.strictEqual(sr.pendingCount, 4);

    // ack 1
    await sr.onRemote('{"clientId":"00000000006400000000000000000000","event":{"name":"append","params":{"a":1}},"eventId":"00000000006500000000000000000000","eventRegistrySignature":"438b04a2f67f6943","postEventSignature":"ca0b885a32fc8b48"}');

    assert.strictEqual(sr.pendingCount, 3);
    assert.strictEqual(sr.stateSignature, '125600492fb0dec7');

    // ack 2
    await sr.onRemote('{"clientId":"00000000006400000000000000000000","event":{"name":"append","params":{"b":2}},"eventId":"00000000006600000000000000000000","eventRegistrySignature":"438b04a2f67f6943","postEventSignature":"125600492fb0dec7"}');

    assert.strictEqual(sr.pendingCount, 2);
    assert.strictEqual(sr.stateSignature, '125600492fb0dec7');

    // event from another client
    await sr.onRemote('{"clientId":"00000000006300000000000000000000","event":{"name":"append","params":{"d":4}},"eventId":"00000000006900000000000000000000","eventRegistrySignature":"438b04a2f67f6943","postEventSignature":"399479ffa4646446"}');

    assert.strictEqual(sr.pendingCount, 2);
    assert.strictEqual(sr.stateSignature, '399479ffa4646446');

    // desync
    await sr.onRemote('{"clientId":"00000000006300000000000000000000","event":{"name":"append","params":{"e":5}},"eventId":"00000000006a00000000000000000000","eventRegistrySignature":"438b04a2f67f6943","postEventSignature":""}');

    assert.deepStrictEqual(errors[1], {
      error: 'ON_REMOTE_STATE_SIGNATURE_MISMATCH',
      details: {signature: 'f441174317511daa', postEventSignature: ''},
    });

    // desync ignored and not applied.
    assert.deepStrictEqual(sr.state, {a: 1, b: 2, d: 4});
    assert.strictEqual(sr.pendingCount, 2);
    assert.strictEqual(sr.stateSignature, '399479ffa4646446');

    // ack 3
    await sr.onRemote('{"clientId":"00000000006400000000000000000000","event":{"name":"append","params":{"c":3}},"eventId":"00000000006700000000000000000000","eventRegistrySignature":"438b04a2f67f6943","postEventSignature":"323c93acb75e8997"}');

    assert.deepStrictEqual(sr.headState, {a: 1, b: 2, c: 3, d: 4});
    assert.deepStrictEqual(sr.state, {a: 1, b: 2, d: 4});
    assert.strictEqual(sr.pendingCount, 1);

    // ack 4
    await sr.onRemote('{"clientId":"00000000006400000000000000000000","event":{"name":"remove","params":{"what":"c"}},"eventId":"00000000006800000000000000000000","eventRegistrySignature":"438b04a2f67f6943","postEventSignature":"399479ffa4646446"}');
    assert.deepStrictEqual(sr.headState, {a: 1, b: 2, d: 4});
    assert.deepStrictEqual(sr.state, {a: 1, b: 2, d: 4});
    assert.strictEqual(sr.pendingCount, 0);

    // protocol mismatch
    await sr.onRemote('{"clientId":"00000000006400000000000000000000","event":{"name":"remove","params":{"what":"c"}},"eventId":"00000000006c00000000000000000000","eventRegistrySignature":"5ed83c298a4eaafx","postEventSignature":"399479ffa4646446"}');
    assert.deepStrictEqual(errors[2], {
      error: 'ON_REMOTE_EVENT_REGISTRY_SIGNATURE_MISMATCH',
      details: {remoteSignature: '5ed83c298a4eaafx', localSignature: '438b04a2f67f6943'},
    });

    // event apply throws Error
    await sr.onRemote('{"clientId":"00000000006400000000000000000000","event":{"name":"exception","params":{}},"eventId":"00000000006d00000000000000000000","eventRegistrySignature":"438b04a2f67f6943","postEventSignature":"399479ffa4646446"}');
    assert.strictEqual(errors[3].error, 'ON_REMOTE_EXCEPTION');
    assert.strictEqual((errors[3].details as any)?.exception.toString(), 'Error: oops');

    // event ignored cases
    await sr.onRemote('{"clientId":"00000000006400000000000000000000","eventId":"00000000006d00000000000000000000","eventRegistrySignature":"438b04a2f67f6943","postEventSignature":"399479ffa4646446"}');
    await sr.onRemote('{"clientId":"00000000006400000000000000000000","event":{},"eventId":"00000000006d00000000000000000000","eventRegistrySignature":"438b04a2f67f6943","postEventSignature":"399479ffa4646446"}');
    await sr.onRemote('{"clientId":"00000000006400000000000000000000","event":{"name":"-"},"eventId":"00000000006d00000000000000000000","eventRegistrySignature":"438b04a2f67f6943","postEventSignature":"399479ffa4646446"}');

  });
});
