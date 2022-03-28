import {ctxWebSocketType} from '@nereid/nodesrv';
import {serializableType, starRepositoryServerFactory} from '@nereid/anycore';
import WebSocket from "ws";
import {creeperEventRegistry} from "@nereid/creeper";

const srCreepers = starRepositoryServerFactory(
  creeperEventRegistry,
  console.error,
  {}
);

const others = {} as Record<string, ctxWebSocketType>;

function subscribeToCommits(ctxWs: ctxWebSocketType) {
  if (others[ctxWs.sessionId] !== ctxWs) {
    const toReplace = others[ctxWs.sessionId];
    if (toReplace) {
      toReplace.ws.close();
    }
    others[ctxWs.sessionId] = ctxWs;
  }
}

export const creeperGet = async (ctxWs: ctxWebSocketType, _params: serializableType): Promise<serializableType> => {
  subscribeToCommits(ctxWs);
  return {state: srCreepers.state};
};

async function sendCommits(msg: serializableType) {
  await Promise.all(Object.values(others).map(other => {
    if (other.ws?.readyState === WebSocket.OPEN) {
      return other.call('creeper.commit', msg);
    } else {
      delete others[other.sessionId];
    }
  }));
}

export const creeperCommit = async (ctxWs: ctxWebSocketType, params: serializableType): Promise<serializableType> => {
  const p = params as {
    name?: string,
  };

  if (ctxWs.settings.session?.enabled) {
    // force name to match session user if we are using sessions.
    p.name = ctxWs.user?.displayName;
  }

  if (!p.name) {
    // name has to be set for this to make any sense.
    return false;
  }

  const msg = await srCreepers.mergeCommit(p);

  subscribeToCommits(ctxWs);
  await sendCommits(msg);

  return true;
};
