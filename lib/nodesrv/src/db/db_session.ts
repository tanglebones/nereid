import {dbProviderType, dbType} from './db_provider.type';
import {value as createSql} from './db_session_create_sql';
import {value as deleteSql} from './db_session_delete_sql';
import {value as expireSql} from './db_session_expire_sql';
import {value as updateSql} from './db_session_update_sql';
import {value as verifySql} from './db_session_verify_sql';
import debugCtor = require('debug');
import {ctxSetDb} from '../ctx';
import {serializableType} from '@nereid/anycore';
import {ctxBaseType} from '../server.type';

const debug = debugCtor('db:session');

export async function sessionCreate(ctx: Pick<ctxBaseType, 'sessionId' | 'session' | 'dbProvider' | 'db'>): Promise<void> {
  return ctx.dbProvider('-SESSION-', async (db: dbType) => {
    const result: { session_id?: string } = await db.one(createSql);
    debug(`create result: ${JSON.stringify(result)}`);
    if (!result.session_id) {
      throw Error('could not create a new session.');
    }
    ctx.sessionId = result.session_id;
    ctx.session = {};
    ctxSetDb(ctx);
  }, '-');
}

export async function sessionVerify(ctx: Pick<ctxBaseType, 'sessionId' | 'session' | 'dbProvider' | 'user' | 'db' | 'settings'>): Promise<void> {
  if (!ctx.sessionId) {
    await sessionCreate(ctx);
  }
  return ctx.dbProvider('-SESSION-', async (db: dbType) => {
    const result: {
      login_id: string,
      login?: string,
      display_name?: string,
      app_data?: Record<string, serializableType>,
      system_data?: Record<string, serializableType>,
    } | undefined = await db.oneOrNone(
      verifySql,
      {
        sessionId: ctx.sessionId,
      },
    );
    debug(`verify result: ${JSON.stringify(result)}`);
    if (!result) {
      ctx.sessionId = '';
      await sessionCreate(ctx);
    } else {
        ctx.user = {
          login: result.login,
          login_id: result.login_id,
          display_name: result.display_name,
        };

      ctx.session = {
        app: result.app_data,
        system: result.system_data,
      };
    }
  }, ctx.sessionId);
}

export async function sessionUpdate(ctx: Pick<ctxBaseType, 'sessionId' | 'session' | 'dbProvider' | 'user' | 'settings'>): Promise<void> {
  if (!ctx.sessionId) {
    return;
  }

  return ctx.dbProvider('-SESSION-', async (db: dbType) => {
    const result = await db.result(
      updateSql,
      {
        sessionId: ctx.sessionId,
        app_data: ctx.session?.app,
        system_data: ctx.session?.system,
        login_id: ctx.user?.login_id,
      },
    );
    debug(`update result: ${JSON.stringify(result)}`);
  }, ctx.sessionId);
}

export async function sessionDelete(ctx: { sessionId: string, dbProvider: dbProviderType }): Promise<void> {
  return ctx.dbProvider('-SESSION-', async (db) => {
    const result = await db.result(deleteSql, {sessionId: ctx.sessionId});
    debug(`delete result: ${JSON.stringify(result)}`);
  }, ctx.sessionId);
}

/* expire old sessions, should be done on an interval setup in server so doesn't have a context */
export async function sessionExpire(dbProvider: dbProviderType): Promise<void> {
  return dbProvider('-SESSION-', async (db) => {
    const result = await db.result(expireSql);
    debug(`expire result: ${JSON.stringify(result)}`);
  }, '-');
}


