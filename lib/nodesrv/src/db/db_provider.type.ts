import {serializableType} from "@nereid/anycore";

export type dbResult = {
  rows: unknown[],
  fields: { name: string, dataTypeId: number }[],
  command: string,
  rowCount: number,
};

export type dbType = {
  any: <T>(query: string, binds?: Record<string, serializableType>) => Promise<Iterator<T>>,
  one: <T>(query: string, binds?: Record<string, serializableType>) => Promise<T>,
  none: (query: string, binds?: Record<string, serializableType>) => Promise<undefined>,
  oneOrNone: <T>(query: string, binds?: Record<string, serializableType>) => Promise<T | undefined>,
  tx: <T>(callback: (db: dbType) => Promise<T>) => Promise<T>,
  result: (query: string, binds?: Record<string, serializableType>) => Promise<dbResult | undefined>,
};

export type dbProviderType = <T>(
  auditUser: string,
  callback: (db: dbType) => Promise<T>,
  trackingTag?: string,
) => Promise<T | undefined>;

export type dbProviderCtxType = <T>(callback: (db: dbType) => Promise<T>) => Promise<T | undefined>;