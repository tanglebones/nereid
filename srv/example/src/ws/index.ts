
import {wsEcho} from './echo';
import {wsUserInfo} from './user/info';
import {ctxWsType, wsHandlerType} from "@nereid/nodesrv";
import {resolvedUndefined, serializableType} from "@nereid/anycore";

export const wsHandlerRegistry = {
  'echo': wsEcho,
  'user/info': wsUserInfo,
} as Record<string, wsHandlerType>;

export async function wsOnConnectHandler(ctxWs: ctxWsType): Promise<serializableType> {
  console.log(`wsOnConnect: ${ctxWs?.user?.login || ctxWs.sessionId || 'wtf?'}`);
  return resolvedUndefined;
}

export async function wsOnCloseHandler(ctxWs: ctxWsType): Promise<serializableType> {
  console.log(`wsOnClose: ${ctxWs?.user?.login || ctxWs.sessionId || 'wtf?'}`);
  return resolvedUndefined;
}
