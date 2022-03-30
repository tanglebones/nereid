import {ctxWebSocketType} from '@nereid/nodesrv';
import {serializableType, starRepositoryServerFactory, stateModifierFunctionType} from '@nereid/anycore';
import WebSocket from "ws";

export const creeperCtor = (creeperEventRegistry: Readonly<Record<string, stateModifierFunctionType>>) => {
  const srCreepers = starRepositoryServerFactory(
    creeperEventRegistry,
    console.error,
    {}
  );

  const others = {} as Record<string, ctxWebSocketType>;

  const subscribeToCommits = (ctxWs: ctxWebSocketType) => {
    if (others[ctxWs.sessionId] !== ctxWs) {
      const toReplace = others[ctxWs.sessionId];
      if (toReplace) {
        toReplace.ws.close();
      }
      others[ctxWs.sessionId] = ctxWs;
    }
  };

  const wsGetState = async (ctxWs: ctxWebSocketType, _params: serializableType): Promise<serializableType> => {
    subscribeToCommits(ctxWs);
    return {state: srCreepers.state};
  };

  const sendCommits = async (msg: serializableType) => {
    await Promise.all(Object.values(others).map(other => {
      if (other.ws?.readyState === WebSocket.OPEN) {
        return other.call('creeper.rebase', msg);
      } else {
        delete others[other.sessionId];
      }
    }));
  };

  const wsCommit = async (ctxWs: ctxWebSocketType, params: serializableType): Promise<serializableType> => {
    const msg = srCreepers.mergeCommit(params);

    subscribeToCommits(ctxWs);
    await sendCommits(msg);

    return true;
  };

  return {wsGetState, wsCommit};
};

export type creeperType = ReturnType<typeof creeperCtor>;
