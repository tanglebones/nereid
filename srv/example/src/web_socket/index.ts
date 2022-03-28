import {echo} from './echo';
import {userInfo} from './user_info';
import {resolvedUndefined, serializableType} from "@nereid/anycore";
import {creeperCommit, creeperGet} from "./creeper";
import {ctxWebSocketType, webSocketHandlerType} from "@nereid/nodesrv";

export const wsHandlerRegistry = {
  'echo': echo,
  'user.info': userInfo,
  'creeper.commit': creeperCommit,
  'creeper.get': creeperGet,
} as Record<string, webSocketHandlerType>;

export async function wsOnConnectHandler(ctxWs: ctxWebSocketType): Promise<serializableType> {
  console.log(`wsOnConnect: ${ctxWs?.user?.login || ctxWs.sessionId || 'wtf?'}`);
  return resolvedUndefined;
}

export async function wsOnCloseHandler(ctxWs: ctxWebSocketType): Promise<serializableType> {
  console.log(`wsOnClose: ${ctxWs?.user?.login || ctxWs.sessionId || 'wtf?'}`);
  return resolvedUndefined;
}
