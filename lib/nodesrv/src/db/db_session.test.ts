// import assert from 'assert';
// import {serverSettingsType, userInfoType} from '../server.type';
// import {
//   sessionCreate
// //   // , sessionVerify, sessionUpdate, sessionDelete, sessionExpire
// } from './db_session';
// import {value as createSql} from './db_session_create_sql';
// import {value as deleteSql} from './db_session_delete_sql';
// import {value as expireSql} from './db_session_expire_sql';
// import {value as updateClientSql} from './db_session_update_sql';
// import {value as verifyStaffSql} from './db_session_verify_sql';
// import {resolvedUndefined, serializableType} from '@nereid/anycore';

import {dbProviderCtor} from "./db_provider";
import {toDbProvideCtx} from "./db_util";

describe('sessionCreate', () => {
  const testDbProviderCtxCtor = () => {
    let connectionString = process.env.PGDB_URL_TEST;
    if (!connectionString) {
      throw new Error("PGDB_URL_TEST not set")
    }
    const dbProviderCtx = toDbProvideCtx('test', '-', dbProviderCtor(connectionString));
    return dbProviderCtx;
  };

  it('happy path', async () => {
    const testDbProviderCtx = testDbProviderCtxCtor();
    await testDbProviderCtx(async db => {
      console.log(await db.one('select 1 as foo'));
    });
  });
});
