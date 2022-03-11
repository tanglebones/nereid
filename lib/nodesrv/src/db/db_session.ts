import {dbProviderType} from './db_provider.type';
import {value as createSql} from './db_session_create_sql';
import {value as deleteSql} from './db_session_delete_sql';
import {value as expireSql} from './db_session_expire_sql';
import {value as updateSql} from './db_session_update_sql';
import {value as verifySql} from './db_session_verify_sql';
import debugCtor = require('debug');
import {serializableType} from '@nereid/anycore';
import {ctxBaseType} from '../server.type';
import {toDbProvideCtx} from "./db_util";

const debug = debugCtor('db:session');

export const sessionCreate = async (ctx: Pick<ctxBaseType, 'sessionId' | 'session' | 'dbProviderCtx' | 'dbProvider'>) =>
  ctx.dbProvider('-session-', async db => {
    const result: { session_id?: string } = await db.one(createSql);
    debug(`create result: ${JSON.stringify(result)}`);

    if (!result.session_id) {
      throw Error('could not create a new session.');
    }

    ctx.sessionId = result.session_id;
    ctx.session = {app: {}, system: {}};
    ctx.dbProviderCtx = toDbProvideCtx('-', ctx.sessionId, ctx.dbProvider);
  });

export const sessionVerify = async (ctx: Pick<ctxBaseType, 'sessionId' | 'session' | 'user' | 'dbProvider' | 'dbProviderCtx'>) =>
  ctx.dbProvider('-session-', async db => {
    const result: {
      login_id: string,
      login?: string,
      display_name?: string,
      data?: Record<string, serializableType>,
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
        loginId: result.login_id,
        displayName: result.display_name,
      };

      ctx.session = result.data;
      ctx.dbProviderCtx = toDbProvideCtx(result.login_id, ctx.sessionId, ctx.dbProvider);
      // todo: load permissions
    }
  });

export const sessionUpdate = async (ctx: Pick<ctxBaseType, 'sessionId' | 'session' | 'dbProvider' | 'user'>) =>
  ctx.dbProvider('-session-', async db => {
    const result = await db.result(
      updateSql,
      {
        sessionId: ctx.sessionId,
        data: ctx.session,
        loginId: ctx.user?.loginId,
      },
    );

    debug(`update result: ${JSON.stringify(result)}`);
  });

export const sessionDelete = async (ctx: Pick<ctxBaseType, 'sessionId' | 'dbProvider'>) =>
  ctx.dbProvider('-session-', async db => {
    const result = await db.result(deleteSql, {sessionId: ctx.sessionId});
    debug(`delete result: ${JSON.stringify(result)}`);
  });

/* expire old sessions, should be done on an interval setup in server so doesn't have a context */
export const sessionExpire = async (dbProvider: dbProviderType) =>
  dbProvider('-session-', async db => {
    const result = await db.result(expireSql);
    debug(`expire result: ${JSON.stringify(result)}`);
  });


