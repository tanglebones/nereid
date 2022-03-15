import {dbProviderType} from './db_provider.type';
import {value as createSql} from './db_session_create_sql';
import {value as deleteSql} from './db_session_delete_sql';
import {value as expireSql} from './db_session_expire_sql';
import {value as updateSql} from './db_session_update_sql';
import {value as permissionSelectPermissionsSql} from './db_permission_select_permissions_sql';
import {value as verifySql} from './db_session_verify_sql';
import {serializableType} from '@nereid/anycore';
import {ctxBaseType} from '../server.type';
import {toDbProvideCtx} from "./db_util";
import {permissionResolve} from "../permission_resolve";
import debugCtor = require('debug');

const debug = debugCtor('db:session');

export const sessionCreate = async (ctx: ctxBaseType) =>
  ctx.dbProvider('-session-', async db => {
    const result: { session_id?: string } = await db.one(createSql);
    debug(`create result: ${JSON.stringify(result)}`);

    if (!result.session_id) {
      throw Error('could not create a new session.');
    }

    ctx.sessionId = result.session_id;
    ctx.dbProviderCtx = toDbProvideCtx('-', ctx.sessionId, ctx.dbProvider);
  });

export const sessionVerify = async (ctx: ctxBaseType) =>
  ctx.dbProvider('-session-', async db => {
    if (!ctx.sessionId || !ctx.sessionId.match(/^[-_a-zA-Z0-9]{43}$/)) {
      return sessionCreate(ctx);
    }

    const result: {
      login_id?: string,
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
      return sessionCreate(ctx);
    } else {
      ctx.session = result.data;
      const loginId = result.login_id;
      if (loginId) {
        ctx.user = {
          login: result.login,
          loginId,
          displayName: result.display_name,
        };
        ctx.dbProviderCtx = toDbProvideCtx(loginId, ctx.sessionId, ctx.dbProvider);
        ctx.permission = permissionResolve(await db.any<{ permission_name: string, relation_type: string }>(permissionSelectPermissionsSql, {loginId}));
      } else {
        ctx.dbProviderCtx = toDbProvideCtx('-', ctx.sessionId, ctx.dbProvider);
      }
    }
  });

export const sessionUpdate = async (ctx: ctxBaseType) =>
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

export const sessionDelete = async (ctx: ctxBaseType) =>
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


