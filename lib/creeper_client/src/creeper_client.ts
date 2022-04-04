import {serializableType, starRepositoryCloneFactoryType, stateModifierFunctionType} from "@nereid/anycore";
import {pubSubCtor, webSocketRpcType} from "@nereid/webcore";
import {Duration} from "luxon";

export const creeperClientCtorCtor = (
  starRepositoryCloneFactory: starRepositoryCloneFactoryType,
  creeperEventRegistry: Readonly<Record<string, stateModifierFunctionType>>
) => (
  webSocketRpc: webSocketRpcType
) => {
  const onRebase = pubSubCtor<void>();

  const repo = starRepositoryCloneFactory(
    creeperEventRegistry,
    console.error,
    {}
  );

  const setState = async (params: serializableType) => {
    repo.serverState = params;
    return true;
  }

  const rebase = async (params: serializableType) => {
    repo.onRebase(params);
    await onRebase.pub();
    return true;
  }

  webSocketRpc.addModule({
    name: 'creeper',
    mode: 'client',
    calls: {
      setState,
      rebase,
    },
  });

  const getState = (timeout?: Duration) => webSocketRpc.call("creeper", "getState", {}, timeout) as Promise<{ state: serializableType, stateSignature: string }>;
  const commit = (message: serializableType, timeout?: Duration) => webSocketRpc.call("creeper", "commit", message, timeout) as Promise<boolean>;

  let name = '-';

  return {
    async syncState() {
      const {state, stateSignature} = await getState();
      repo.serverState = state;
      if (repo.serverStateSignature !== stateSignature) {
        throw new Error('SYNC_STATE_MISMATCH');
      }
    },
    async updateLocation() {
      const localCommit = repo.localCommit('updateV0', {
        name,
        location: window.location.pathname
      });
      return await commit(localCommit);
    },
    get name() {
      return name;
    },
    set name(value: string) {
      name = value;
    },
    get serverState() {
      return repo.serverState;
    },
    get localState() {
      return repo.localState;
    },
    onRebase(callback: () => Promise<void>) {
      return onRebase.sub(callback);
    }
  };
}

export type creeperClientCtorType = ReturnType<typeof creeperClientCtorCtor>;
export type creeperClientType = ReturnType<creeperClientCtorType>;
