import {ctxWebSocketType, webSocketHandlerType} from '@nereid/nodesrv';
import {serializableType, starRepositoryServerFactoryType, stateModifierFunctionType} from '@nereid/anycore';
import WebSocket from "ws";
import {starRepositoryServerFactory} from "@nereid/nodecore";
import {creeperEventRegistry} from "@nereid/creeper";

export const creeperServerCtor = (starRepositoryServerFactory: starRepositoryServerFactoryType, creeperEventRegistry: Readonly<Record<string, stateModifierFunctionType>>) => {
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
    return {state: repo.state};
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
      const msg = repo.localCommit('updateV0', {loginId});
      await sendCommits(msg);
    }
  };

  const wsCommit = async (ctxWs: ctxWebSocketType, params: serializableType): Promise<serializableType> => {
    const p = params as { event?: { loginId?: string } };
    if (!p.event) {
      return false;
    }

    p.event.loginId = ctxWs.user?.loginId ?? ctxWs.sessionId;

    const msg = repo.mergeCommit(params);

    subscribeToCommits(ctxWs);
    await sendCommits(msg);

    return true;
  };

  return {wsGetState, wsCommit, repo, ctxWsSubs};
};

export const creeperServer = creeperServerCtor(starRepositoryServerFactory, creeperEventRegistry);

export const wsCreeperServerHandlerRegistry = {
  'creeper.commit': creeperServer.wsCommit,
  'creeper.getState': creeperServer.wsGetState,
} as Record<string, webSocketHandlerType>;
