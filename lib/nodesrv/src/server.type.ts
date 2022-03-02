import {IncomingMessage, ServerResponse} from 'http';
import WebSocket from 'ws';
import {serializableType} from 'ts_agnostic';
import {registryType} from 'ts_agnostic';
import {dbProviderCtxType} from './db_util';
import {dbProviderType} from './db';

export type urlType = {
  path: string,
  params: [string, string][],
}

export type userInfoType = {
  login: string;
  clientProfileId?: string;
  federatedLoginId?: string;
};

export type ctxBaseType = {
  sessionId: string;
  settings: serverSettingsType;
  session: Record<string, serializableType>;
  permission?: Record<string, boolean>;
  user?: userInfoType;
  db: dbProviderCtxType;
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
  requests: registryType<requestType>,
}

export type ctxType = ctxReqType & {
  res: ServerResponse,
}

type userType = {
  login: string;
  display_name: string;
};

export type userStoreType = {
  [userId: string]: userType
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
  mode?: 'client' | 'staff',
  google?: {
    secret: string;
    redirectUri: string;
    id: string;
  },
  appUrl: string,
  dbConnectionString: string,
  [key: string]: serializableType,
};

export type wsHandlerType = (ctxWs: ctxWsType, callParams: serializableType | undefined) => Promise<serializableType | undefined>;
