/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars */
// istanbul ignore file
// -- test helper

import {dbType} from './db_provider';
import * as sinon from 'sinon';

type sinonType = typeof sinon;

export function dbProviderStub(sinon: sinonType): {
  dbProvider: any,
  dbProviderAnon: any,
  ctxDbProvider: any,
  db: any,
}
 {
  const db: any = sinon.stub();

  ['one', 'any', 'none', 'query', 'result', 'oneOrNone'].forEach((toStub): void => {
    db[toStub] = sinon.stub();
  });

  async function wrapperFull<T>(auditUser: string, q: (db: dbType) => Promise<T>, trackingTag = ''): Promise<T> {
    return q(db);
  }

  async function wrapperAnon<T>(q: (db: dbType) => Promise<T>, trackingTag = ''): Promise<T> {
    return q(db);
  }

  async function wrapperCtx<T>(q: (db: dbType) => Promise<T>): Promise<T> {
    return q(db);
  }

  const dbProvider = sinon.spy(wrapperFull);
  const dbProviderAnon = sinon.spy(wrapperAnon);
  const ctxDbProvider = sinon.spy(wrapperCtx);
  return {dbProvider, dbProviderAnon, ctxDbProvider, db};
}
