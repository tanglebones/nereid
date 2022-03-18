import {Draft, Immutable, produce} from 'immer';
import {deserialize, serializableType, serialize} from './serialize';
import {signature, signatureObjectKeys} from "./signature";

type immutableSerializableType = Immutable<serializableType>;
export type stateModifierFunctionType = (eventParams: serializableType, state: Draft<serializableType>) => void;

export type eventType = {
  name: string,
  params: serializableType,
};

export type eventPacketType = {
  event: eventType,
  clientId: string,
  eventId: string,
  eventRegistrySignature: string,
  postEventSignature: string,
};

export type starRepositoryType = {
  apply: (name: string, params: serializableType) => Promise<void>;
  onRemote: (message: string) => Promise<void>;
  readonly clientId: string;
  readonly pendingCount: number;
  readonly state: immutableSerializableType;
  readonly headState: immutableSerializableType;
  readonly stateSignature: string;
};

// Designed for where you have a single threaded websocket server that each
// client is sending events too and the server relays to all connected clients
// in the same order.
export const starRepositoryFactoryCtor = (tuidFactory: () => string) => (
  eventRegistry: Readonly<Record<string, stateModifierFunctionType>>,
  onLocal: (message: string) => Promise<void>,
  onError: (error: string, details: Record<string, unknown>) => void,
  stateSigMode: 'enforce'|'ignore' = 'enforce', // on the server this should be 'ignore' if the events are commutative, on clients it should be 'enforce'.
  initialState: serializableType = {},
): starRepositoryType => {
  const clientId = tuidFactory();
  const localPendingEvents = {} as Record<string, eventType>;
  const eventRegistrySignature = signatureObjectKeys(eventRegistry);
  let state: immutableSerializableType = produce(initialState, (x) => x); // committed at the server
  let headState: immutableSerializableType = state; // server + local events not yet committed at the server
  let signatureValid = false;
  let sig = '';

  const computeStateSignature = (invalidate = false) => {
    if (!signatureValid || invalidate) {
      sig = signature([serialize(state as serializableType)]);
      signatureValid = true;
    }
    return sig;
  };

  const apply = async (name: string, params: serializableType) => {
    const stateModifier = eventRegistry[name];

    if (!stateModifier) {
      onError('NOT_IN_EVENT_REGISTRY', {name, local: true});
      return;
    }

    const eventId = tuidFactory();
    const event: eventType = {name, params};

    localPendingEvents[eventId] = event;

    state = produce(state, x => stateModifier(event.params, x));

    const packet: eventPacketType = {
      event,
      clientId,
      eventId,
      eventRegistrySignature,
      postEventSignature: computeStateSignature(true),
    };

    await onLocal(serialize(packet));
  };

  const onRemote = async (message: string) => {
    try {
      const eventPacket = deserialize<eventPacketType>(message);
      if (eventPacket.eventRegistrySignature !== eventRegistrySignature) {
        onError('ON_REMOTE_EVENT_REGISTRY_SIGNATURE_MISMATCH', {
            remoteSignature: eventPacket.eventRegistrySignature,
            localSignature: eventRegistrySignature,
          },
        );
        return;
      }

      if (eventPacket.clientId === clientId && eventPacket.eventId) {
        delete localPendingEvents[eventPacket.eventId];
      }

      const event = eventPacket.event;

      if (!event) {
        return;
      }

      if (!event.name) {
        return;
      }

      const stateModifier = eventRegistry[event.name];

      if (!stateModifier) {
        return;
      }

      const _state = state;
      state = produce(headState, x => stateModifier(event.params, x));

      computeStateSignature(true);
      if (stateSigMode === 'enforce' && eventPacket.postEventSignature !== sig) {
        onError('ON_REMOTE_STATE_SIGNATURE_MISMATCH', {
          signature: sig,
          postEventSignature: eventPacket.postEventSignature,
        });
        state = _state;
        signatureValid = false;
        return;
      }

      headState = state;

      const localPendingEventIdsInOrder = Object.keys(localPendingEvents).sort();
      for (const id of localPendingEventIdsInOrder) {
        const event = localPendingEvents[id];
        const stateModifier = eventRegistry[event.name];

        state = produce(state, x => stateModifier(event.params, x));
      }
      signatureValid = false;
    } catch (exception) {
      onError('ON_REMOTE_EXCEPTION', {exception});
    }
  };

  return {
    apply,
    onRemote,
    get state() {
      return state;
    },
    get headState() {
      return headState;
    },
    get stateSignature() {
      computeStateSignature();
      return sig;
    },
    get clientId() {
      return clientId;
    },
    get pendingCount() {
      return Object.keys(localPendingEvents).length;
    },
  };
};
