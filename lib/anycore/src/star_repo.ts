import {Draft, Immutable, produce} from 'immer';
import {serializableType, serialize} from './serialize';
import {signature, signatureObjectKeys} from "./signature";
import {RecursivePartial} from "./recursive_partial.type";

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
  preMergeSignature?: string,
  postMergeSignature?: string,
};

export type starRepositoryServerType = {
  localCommit: (name: string, params: serializableType) => serializableType;
  mergeCommit: (commitMessageFromClient: serializableType) => serializableType;
  readonly state: serializableType;
  readonly stateSignature: string;
  readonly eventRegistrySignature: string;
};

export const starRepositoryServerFactoryCtor = (tuidFactory: () => string) => (
  eventRegistry: Readonly<Record<string, stateModifierFunctionType>>,
  onError: (error: string, details: Record<string, unknown>) => void,
  initialState: serializableType
): starRepositoryServerType => {
  const eventRegistrySignature = signatureObjectKeys(eventRegistry);
  const clientId = tuidFactory();
  let state: immutableSerializableType = produce(initialState, (x) => x);
  let stateSignature = '';

  const computeStateSignature = () => {
    stateSignature = signature([serialize(state as serializableType)]);
  };

  computeStateSignature();

  const localCommit = (name: string, params: serializableType): serializableType => {
    const stateModifier = eventRegistry[name];

    if (!stateModifier) {
      onError('NOT_IN_EVENT_REGISTRY', {name, local: true});
      return;
    }

    const eventId = tuidFactory();
    const event: eventType = {name, params};

    state = produce(state, x => stateModifier(event.params, x));
    const preMergeSignature = stateSignature;
    computeStateSignature();
    const postMergeSignature = stateSignature;

    return {
      event,
      clientId,
      eventId,
      eventRegistrySignature,
      preMergeSignature,
      postMergeSignature,
    }; // commitMessage to send to clients
  };

  const mergeCommit = (commitMessageFromClient: serializableType) => {
    try {
      const eventPacket = commitMessageFromClient as RecursivePartial<eventPacketType>;
      if (eventPacket.eventRegistrySignature !== eventRegistrySignature) {
        onError('ON_REMOTE_EVENT_REGISTRY_SIGNATURE_MISMATCH', {
            remoteSignature: eventPacket.eventRegistrySignature,
            localSignature: eventRegistrySignature,
          },
        );
        return;
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

      state = produce(state, x => stateModifier(event.params, x));

      eventPacket.preMergeSignature = stateSignature;
      computeStateSignature();
      eventPacket.postMergeSignature = stateSignature;

      return eventPacket;
    } catch (exception) {
      onError('ON_REMOTE_EXCEPTION', {exception: `${exception}`});
    }
  };

  return {
    localCommit,
    mergeCommit,
    get state() {
      return state as serializableType;
    },
    get stateSignature() {
      return stateSignature;
    },
    get eventRegistrySignature() {
      return eventRegistrySignature;
    }
  };
};

export type starRepositoryCloneType = {
  localCommit: (name: string, params: serializableType) => serializableType;
  onRebase: (mergeMessageFromServer: serializableType) => void;
  readonly clientId: string;
  readonly pendingCount: number;
  readonly localState: immutableSerializableType;
  serverState: immutableSerializableType;
  readonly serverStateSignature: string;
  readonly eventRegistrySignature: string;
};

export const starRepositoryCloneFactoryCtor = (tuidFactory: () => string) => (
  eventRegistry: Readonly<Record<string, stateModifierFunctionType>>,
  onError: (error: string, details: Record<string, unknown>) => void,
  initialState: serializableType, // get it from the server
): starRepositoryCloneType => {
  const clientId = tuidFactory();
  const eventRegistrySignature = signatureObjectKeys(eventRegistry);

  let localPendingEvents = {} as Record<string, eventType>;
  let serverState: immutableSerializableType = produce(initialState, (x) => x); // committed at the server
  let localState: immutableSerializableType = serverState; // server + local events not yet committed at the server
  let serverStateSignature = '';

  const computeServerStateSignature = () => {
    serverStateSignature = signature([serialize(serverState as serializableType)]);
  };

  computeServerStateSignature();

  const localCommit = (name: string, params: serializableType): serializableType => {
    const stateModifier = eventRegistry[name];

    if (!stateModifier) {
      onError('NOT_IN_EVENT_REGISTRY', {name, local: true});
      return;
    }

    const eventId = tuidFactory();
    const event: eventType = {name, params};

    localPendingEvents[eventId] = event;

    localState = produce(localState, x => stateModifier(event.params, x));

    return {
      event,
      clientId,
      eventId,
      eventRegistrySignature
    }; // commitMessage to send to server
  };

  const onRebase = (mergeMessageFromServer: serializableType) => {
    try {
      const eventPacket = mergeMessageFromServer as RecursivePartial<eventPacketType>;
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

      if (eventPacket?.preMergeSignature !== serverStateSignature) {
        onError('ON_REMOTE_STATE_PRE_SIGNATURE_MISMATCH', {
          signature: serverStateSignature,
          preMergeSignature: eventPacket.preMergeSignature,
        });
        return;
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

      const _state = serverState;
      const _sig = serverStateSignature;
      serverState = produce(serverState, x => stateModifier(event.params, x));

      computeServerStateSignature();

      if (eventPacket.postMergeSignature !== serverStateSignature) {
        onError('ON_REMOTE_STATE_POST_SIGNATURE_MISMATCH', {
          signature: serverStateSignature,
          postMergeSignature: eventPacket.postMergeSignature,
        });

        // revert
        serverState = _state;
        serverStateSignature = _sig;
        return;
      }

      localState = serverState;

      // replay local events not yet merged by the server.
      const localPendingEventIdsInOrder = Object.keys(localPendingEvents).sort();
      for (const id of localPendingEventIdsInOrder) {
        const event = localPendingEvents[id];
        const stateModifier = eventRegistry[event.name];

        localState = produce(localState, x => stateModifier(event.params, x));
      }

    } catch (exception) {
      onError('ON_REMOTE_EXCEPTION', {exception: `${exception}`});
    }
  };

  return {
    localCommit,
    onRebase,
    get localState() {
      return localState as serializableType;
    },
    get serverState() {
      return serverState as serializableType;
    },
    set serverState(newState: serializableType) {
      localState = newState;
      localPendingEvents = {};
      serverState = produce(newState, x => x);
      computeServerStateSignature();
    },
    get serverStateSignature() {
      return serverStateSignature;
    },
    get clientId() {
      return clientId;
    },
    get pendingCount() {
      return Object.keys(localPendingEvents).length;
    },
    get eventRegistrySignature() {
      return eventRegistrySignature;
    }
  };
};

export type starRepositoryServerFactoryType = ReturnType<typeof starRepositoryServerFactoryCtor>;
export type starRepositoryCloneFactoryType = ReturnType<typeof starRepositoryCloneFactoryCtor>;
