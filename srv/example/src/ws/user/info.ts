import {ctxWsType} from '@nereid/nodesrv';
import {serializableType} from '@nereid/anycore';

export async function wsUserInfo(ctxWs: ctxWsType, _params: serializableType): Promise<serializableType> {
  return { login: ctxWs?.user?.login};
}
