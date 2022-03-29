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
  mergeCommit: (commitMessageFromClient: serializableType) => Promise<serializableType>;
  readonly state: serializableType;
  readonly stateSignature: string;
};

export const starRepositoryServerFactory = (
  eventRegistry: Readonly<Record<string, stateModifierFunctionType>>,
  onError: (error: string, details: Record<string, unknown>) => void,
  initialState: serializableType
): starRepositoryServerType => {
  const eventRegistrySignature = signatureObjectKeys(eventRegistry);
  let state: immutableSerializableType = produce(initialState, (x) => x);
  let stateSignature = '';

  const computeStateSignature = () => {
    stateSignature = signature([serialize(state as serializableType)]);
  };

  computeStateSignature();

  const mergeCommit = async (commitMessageFromClient: serializableType) => {
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
    mergeCommit,
    get state() {
      return state as serializableType;
    },
    get stateSignature() {
      return stateSignature;
    },
  };
};

export type starRepositoryCloneType = {
  commit: (name: string, params: serializableType) => Promise<serializableType>;
  onRebase: (mergeMessageFromServer: serializableType) => Promise<void>;
  readonly clientId: string;
  readonly pendingCount: number;
  readonly state: immutableSerializableType;
  serverState: immutableSerializableType;
  readonly serverStateSignature: string;
};

export const starRepositoryCloneFactoryCtor = (tuidFactory: () => string) => (
  eventRegistry: Readonly<Record<string, stateModifierFunctionType>>,
  onError: (error: string, details: Record<string, unknown>) => void,
  initialState: serializableType, // get it from the server
): starRepositoryCloneType => {
  const clientId = tuidFactory();
  const localPendingEvents = {} as Record<string, eventType>;
  const eventRegistrySignature = signatureObjectKeys(eventRegistry);
  let serverState: immutableSerializableType = produce(initialState, (x) => x); // committed at the server
  let state: immutableSerializableType = serverState; // server + local events not yet committed at the server
  let serverStateSignature = '';

  const computeServerStateSignature = () => {
    serverStateSignature = signature([serialize(serverState as serializableType)]);
  };

  computeServerStateSignature();

  const commit = async (name: string, params: serializableType): Promise<serializableType> => {
    const stateModifier = eventRegistry[name];

    if (!stateModifier) {
      onError('NOT_IN_EVENT_REGISTRY', {name, local: true});
      return;
    }

    const eventId = tuidFactory();
    const event: eventType = {name, params};

    localPendingEvents[eventId] = event;

    state = produce(state, x => stateModifier(event.params, x));

    return {
      event,
      clientId,
      eventId,
      eventRegistrySignature
    }; // commitMessage to send to server
  };

  const onRebase = async (mergeMessageFromServer: serializableType) => {
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

      state = serverState;

      // replay local events not yet merged by the server.
      const localPendingEventIdsInOrder = Object.keys(localPendingEvents).sort();
      for (const id of localPendingEventIdsInOrder) {
        const event = localPendingEvents[id];
        const stateModifier = eventRegistry[event.name];

        state = produce(state, x => stateModifier(event.params, x));
      }

    } catch (exception) {
      onError('ON_REMOTE_EXCEPTION', {exception: `${exception}`});
    }
  };

  return {
    commit,
    onRebase,
    get state() {
      return state as serializableType;
    },
    get serverState() {
      return serverState as serializableType;
    },
    set serverState(newState: serializableType){
      serverState = produce(newState, x=>x);
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
  };
};

export type starRepositoryCloneFactoryType = ReturnType<typeof starRepositoryCloneFactoryCtor>;
