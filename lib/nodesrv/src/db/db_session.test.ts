import {testDbProviderCtor} from "./test_db_provider_ctx";
import {sessionCreate, sessionUpdate} from "./db_session";
import assert from "assert";
import {dbProviderType} from "./db_provider.type";

describe('sessionCreate', () => {
  it('basics', async () => {
    const application_name = 'sessionCreate/basics';
    // can't use rollback as we have to test with two different db users, so we wipe data instead.
    // can't use truncate due to FKs
    async function clearData(dbStaffProvider: dbProviderType, dbAppProvider: dbProviderType) {
      await dbStaffProvider('-test-', db => db.none('delete from app_login_1_ivkey;'));
      await dbAppProvider('-test-', async db => {
        await db.none('delete from session;');
        await db.none('delete from login;');
      });
    }

    let loginId: string;
    let sessionId: string;

    {
      const preExec = `set local "stime.now" to '2022-01-01T00:00:00Z';`;

      const dbAppProvider = testDbProviderCtor({kind: 'APP', preExec, application_name});
      const dbStaffProvider = testDbProviderCtor({kind: 'STAFF', preExec});

      await clearData(dbStaffProvider, dbAppProvider);

      const ctx: any = {
        sessionId: "",
        dbProvider: dbAppProvider
      };
      await sessionCreate(ctx);
      sessionId = ctx.sessionId;
      assert.strictEqual(sessionId.length, 43);

      const session: any = await dbAppProvider('-', db => db.one(
        `select login_id,
           ivkey,
           app_data,
           system_data,
           created_at :: text as created_at,
           expire_at :: text as expire_at
         from session
         where session_id = func.stuid_from_compact($(sessionId));`
        , {sessionId}));

      assert.strictEqual(session.created_at, "2022-01-01 00:00:00+00");
      assert.strictEqual(session.expire_at, "2022-01-01 01:00:00+00");
      assert.deepStrictEqual(session.app_data, {});
      assert.deepStrictEqual(session.system_data, {});

      assert(!session.login_id);
      assert(!session.ivkey);

      // create a user
      const login = await dbAppProvider('-TEST-', db => db.one<{ login_id: string }>(`
        insert into login (login, display_name, locale_name)
        values ('fool', 'food', 'en')
        returning func.tuid6_to_compact(login_id) as login_id;`));

      assert(login);
      loginId = login.login_id;
    }

    {
      const preExec = `set local "stime.now" to '2022-01-01T00:02:00Z';`;
      const dbAppProvider = testDbProviderCtor({kind: 'APP', preExec, application_name});

      const ctx: any = {
        sessionId,
        dbProvider: dbAppProvider,
        user: {loginId},
        session: {app: {}, system: {}}
      };

      await sessionUpdate(ctx);

      const session2: any = await dbAppProvider('-', db => db.one(
        `select login_id,
           encode(ivkey, 'hex') as ivkey,
           app_data,
           system_data,
           created_at :: text as created_at,
           expire_at :: text as expire_at
         from session
         where login_id = func.tuid6_from_compact($(loginId));`
        , {loginId})
      );
      console.log(session2);
    }
  });
});
