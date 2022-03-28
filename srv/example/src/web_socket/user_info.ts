import {ctxWebSocketType} from '@nereid/nodesrv';
import {serializableType} from '@nereid/anycore';

export const userInfo = async (ctxWs: ctxWebSocketType, _params: serializableType): Promise<serializableType> => ({login: ctxWs?.user?.login});
