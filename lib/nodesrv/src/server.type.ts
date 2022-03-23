import {IncomingMessage, ServerResponse} from 'http';
import WebSocket from 'ws';
import {serializableType} from '@nereid/anycore';
import {dbProviderType, dbProviderCtxType} from './db/db_provider.type';

export type urlType = {
  path: string,
  params: [string, string][],
}

export type userInfoType = {
  loginId: string;
  login?: string;
  displayName?: string;
};

export type ctxBaseType = {
  sessionId: string;
  settings: serverSettingsType;
  session?: Record<string, serializableType>,
  permission?: Record<string, boolean>;
  user?: userInfoType;
  dbProviderCtx: dbProviderCtxType;
  dbProvider: dbProviderType;
  remoteAddress: string;
};

export type ctxReqType = ctxBaseType & {
  req: IncomingMessage;
  url: urlType;
  body?: string;
  host?: string;
  note?: Record<string, serializableType>;
  cookie: [string, string][];
}

export type webSocketExtendedType =
  WebSocket
  & {
  isAlive: boolean;
};

export type requestType = {
  id: string,
  ctxWs: ctxWsType,
  resolve: (r: serializableType) => void,
  reject: (r: serializableType) => void,
  data: string,
  sent: boolean,
};

export type ctxWsType = ctxBaseType & {
  ws: webSocketExtendedType,
  call(name: string, params: serializableType): Promise<serializableType>,
  requests: Record<string, requestType>,
}

export type ctxType = ctxReqType & {
  res: ServerResponse,
}
export type userStoreType = {
  [userId: string]: userInfoType
}

export type gauthUserInfoType = {
  email: string;
  email_verified: boolean;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  locale: string;
};

export type contentHandlerType = (ctx: ctxType) => Promise<void>;
export type reqHandlerType = (ctx: ctxReqType) => Promise<void>;

export type serverSettingsType = {
  host: string;
  port: string | number;
  schema: string;
  appUrl: string,
  session?: {
    enabled: boolean,
    expirySeconds?: number,
    expiryIntervalMs?: number,
    cookieName?: string,
  }
  [key: string]: serializableType,
};

export type wsHandlerType = (ctxWs: ctxWsType, callParams: serializableType | undefined) => Promise<serializableType | undefined>;
