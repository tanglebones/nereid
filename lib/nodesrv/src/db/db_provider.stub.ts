/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars */
// istanbul ignore file
// -- test helper

import {dbType} from './db_provider.type';
import sinon from 'sinon';

type sinonType = typeof sinon;

export const dbProviderStub = (sinon: sinonType): {
  dbProvider: any,
  dbProviderAnon: any,
  ctxDbProvider: any,
  db: any,
} => {
  const db: any = sinon.stub();

  ['one', 'any', 'none', 'oneOrNone','result'].forEach((toStub): void => {
    db[toStub] = sinon.stub();
  });

  async function wrapperFull<T>(_auditUser: string, q: (db: dbType) => Promise<T>, _trackingTag = ''): Promise<T> {
    return q(db);
  }

  async function wrapperAnon<T>(q: (db: dbType) => Promise<T>, _trackingTag = ''): Promise<T> {
    return q(db);
  }

  async function wrapperCtx<T>(q: (db: dbType) => Promise<T>): Promise<T> {
    return q(db);
  }

  const dbProvider = sinon.spy(wrapperFull);
  const dbProviderAnon = sinon.spy(wrapperAnon);
  const ctxDbProvider = sinon.spy(wrapperCtx);
  return {dbProvider, dbProviderAnon, ctxDbProvider, db};
};
