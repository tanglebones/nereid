import {echo} from './echo';
import {userInfo} from './user_info';
import {resolvedUndefined, serializableType} from "@nereid/anycore";
import {ctxWebSocketType, webSocketHandlerType} from "@nereid/nodesrv";
import {wsCreeperServerHandlerRegistry} from "@nereid/creeper_server";

export const wsHandlerRegistry = {
    'echo': echo,
    'user.info': userInfo,
    ...wsCreeperServerHandlerRegistry
  } as Record<string, webSocketHandlerType>;


export const wsOnConnectHandler = async (ctxWs: ctxWebSocketType): Promise<serializableType> => {
  console.log(`wsOnConnect: ${ctxWs?.user?.login || ctxWs.sessionId || 'wtf?'}`);
  return resolvedUndefined;
};

export const wsOnCloseHandler = async (ctxWs: ctxWebSocketType): Promise<serializableType> => {
  console.log(`wsOnClose: ${ctxWs?.user?.login || ctxWs.sessionId || 'wtf?'}`);
  return resolvedUndefined;
};
