import {ctxWsType} from "@nereid/nodesrv";
import {serializableType} from "@nereid/anycore";

export async function wsEcho(ctxWs: ctxWsType, params: serializableType): Promise<serializableType> {
  console.log('server:ws:recv_echo', ctxWs?.user?.login, params);
  console.log('server:ws:call_echo', await ctxWs.call('echo', 'back at ya!'));
  return params;
}
