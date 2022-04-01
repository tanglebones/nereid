import {ctxWebSocketType} from '@nereid/nodesrv';
import {serializableType, starRepositoryServerFactoryType, stateModifierFunctionType} from '@nereid/anycore';
import WebSocket from "ws";

export const creeperServerCtor = (
  nowMs: () => number,
  starRepositoryServerFactory: starRepositoryServerFactoryType,
  creeperEventRegistry: Readonly<Record<string, stateModifierFunctionType>>,
  ) => {
  const repo = starRepositoryServerFactory(
    creeperEventRegistry,
    console.error,
    {}
  );

  const ctxWsSubs = {} as Record<string, ctxWebSocketType>;

  const subscribeToCommits = (ctxWs: ctxWebSocketType) => {
    // NOTE: we rely an a socket's sessionId _never_ changing here,
    // because if it did it would be subscribed more than once.
    if (ctxWsSubs[ctxWs.sessionId] !== ctxWs) {
      const toReplace = ctxWsSubs[ctxWs.sessionId];
      if (toReplace) {
        toReplace.ws.close();
      }
      ctxWsSubs[ctxWs.sessionId] = ctxWs;
    }
  };

  const wsGetState = async (ctxWs: ctxWebSocketType, _params: serializableType): Promise<serializableType> => {
    subscribeToCommits(ctxWs);
    return {
      state: repo.state,
      stateSignature: repo.stateSignature
    };
  };

  const sendCommits = async (msg: serializableType) => {
    const toRemove = [] as string[];
    await Promise.all(Object.values(ctxWsSubs).map(async other => {
      if (other.ws?.readyState === WebSocket.OPEN) {
        await other.call('creeper.rebase', msg);
      } else {
        toRemove.push(other.user?.loginId ?? other.sessionId);
        delete ctxWsSubs[other.sessionId];
      }
    }));

    for (const loginId of toRemove) {
      const s = repo.state as Record<string, unknown>;
      // istanbul ignore else -- hard to setup a test for this...
      if (s[loginId]) {
        const msg = repo.localCommit('updateV0', {loginId});
        // console.log({state: repo.state, stateSignature: repo.stateSignature});
        await sendCommits(msg);
      }
    }
  };

  const wsCommit = async (ctxWs: ctxWebSocketType, params: serializableType): Promise<serializableType> => {
    const p = params as { event?: { params?: { loginId?: string, lastSeen?: number } } };
    if (!p.event?.params) {
      return false;
    }

    p.event.params.loginId = ctxWs.user?.loginId ?? ctxWs.sessionId;
    p.event.params.lastSeen = nowMs();

    const msg = repo.mergeCommit(params);

    // console.log({state: repo.state, stateSignature: repo.stateSignature});

    subscribeToCommits(ctxWs);
    await sendCommits(msg);

    return true;
  };

  return {wsGetState, wsCommit, repo, ctxWsSubs};
};

