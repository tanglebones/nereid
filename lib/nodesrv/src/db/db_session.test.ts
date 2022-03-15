import {testDbProviderCtor} from "./test_db_provider_ctx";
import {sessionCreate, sessionDelete, sessionExpire, sessionUpdate, sessionVerify} from "./db_session";
import assert from "assert";
import {dbType} from "./db_provider.type";
import sinon from "sinon";
import {dbProviderStub} from "./db_provider.stub";

describe('sessionCreate', () => {
  it('basic app flow works and assigns ivkey', async () => {
    const dbTestProvider = testDbProviderCtor({
      kind: 'APP',
      application_name: 'sessionCreate/basics'
    });

    await dbTestProvider(`-test-`, db => {
      return db.tx({}, async db => {
        let loginId: string;
        let sessionId: string;
        let ivkey: string;

        // thread everything through one transaction; test provider rolls back by default.
        const dbProvider = <T>(_: string, cb: (db: dbType) => Promise<T>, __?: string) => cb(db);
        const dbProviderCtx = <T>(cb: (db: dbType) => Promise<T>) => cb(db);
        await db.none(`set local "stime.now" to '2022-01-01T00:00:00Z';set local "stime.now_inc" to '1 second';`);

        {
          const ctx: any = {
            sessionId: "",
            dbProvider,
            dbProviderCtx,
          };

          await sessionCreate(ctx);
          sessionId = ctx.sessionId;
          assert.strictEqual(sessionId.length, 43);

          const session: any = await dbProviderCtx(db => db.one(
            `select
               login_id,
               ivkey,
               data,
               created_at :: text as created_at,
               expire_at :: text as expire_at
             from
               session
             where
               session_id = func.stuid_from_compact($(sessionId));`
            , {sessionId}));

          assert.strictEqual(session.created_at, "2022-01-01 00:00:00+00");
          assert.strictEqual(session.expire_at, "2022-01-01 01:00:01+00");
          assert.deepStrictEqual(session.data, null);

          assert(!session.login_id);
          assert(!session.ivkey); // user not given yet, so no ivkey is assigned.
        }

        {
          // verify works without a login_id
          await sessionUpdate({
            sessionId,
            dbProvider,
            dbProviderCtx,
            session: {be: {test: 1}}
          } as any);

          const ctx: any = {
            sessionId,
            dbProvider,
            dbProviderCtx
          }
          await sessionVerify(ctx);
          assert.deepStrictEqual(ctx.session, {be: {test: 1}});
        }

        {
          // create a user
          const login = await dbProviderCtx(db => {
            return db.one<{ login_id: string }>(`
              insert into
                login (login, display_name, locale_name)
              values
                ('fool', 'food', 'en')
              returning func.tuid6_to_compact(login_id) as login_id;`);
          });

          assert(login);
          loginId = login.login_id;
        }

        {
          // update session after login to contain the login id.
          const ctx: any = {
            sessionId,
            dbProvider,
            dbProviderCtx,
            user: {loginId}
          };

          await sessionUpdate(ctx);

          const session: any = await dbProviderCtx(db => db.one(
            `select
               encode(ivkey, 'hex') as ivkey,
               tuid6_to_compact(login_id) as login_id
             from
               session
             where
               session_id = func.stuid_from_compact($(sessionId));`,
            {sessionId},
          ));
          assert(session.ivkey);
          assert.strictEqual(session.login_id, loginId);
          ivkey = session.ivkey;
        }

        {
          // verify session on subsequent requests
          const ctx: any = {
            sessionId,
            dbProvider,
            dbProviderCtx
          };

          await sessionVerify(ctx);

          const session: any = await dbProviderCtx(db => db.one(
            `select
               encode(ivkey, 'hex') as ivkey,
               tuid6_to_compact(login_id) as login_id
             from
               session
             where
               session_id = func.stuid_from_compact($(sessionId));`,
            {sessionId}
          ));

          assert.strictEqual(session.ivkey, ivkey);
          assert.strictEqual(session.login_id, loginId);
        }

        {
          // remove session so we are sure to get a new one
          const ctx: any = {
            sessionId,
            dbProvider,
            dbProviderCtx
          };
          await sessionDelete(ctx);
        }

        {
          // new session
          const ctx: any = {
            sessionId: "",
            dbProvider,
            dbProviderCtx,
          };

          await sessionCreate(ctx);
          assert.notEqual(sessionId, ctx.sessionId);
          sessionId = ctx.sessionId;

          const session: any = await dbProviderCtx(db => db.one(
            `select
               login_id,
               ivkey
             from
               session
             where
               session_id = func.stuid_from_compact($(sessionId));`,
            {sessionId}
          ));

          assert(!session.login_id);
          assert(!session.ivkey); // user not given yet, so no ivkey is assigned.
        }

        {
          // update session after login to contain the login id.
          const ctx: any = {
            sessionId,
            dbProvider,
            dbProviderCtx,
            session: {fe: {}, be: {redirect: '/home'}},
            user: {loginId}
          };

          await sessionUpdate(ctx);

          const session: any = await dbProviderCtx(db => db.one(
            `select
               encode(ivkey, 'hex') as ivkey,
               data
             from
               session
             where
               session_id = func.stuid_from_compact($(sessionId));`,
            {sessionId},
          ));

          // same ivkey assigned for the user to the session trigger reading staff.app_login_1_ivkey
          assert.strictEqual(session.ivkey, ivkey);
          // session data is saved
          assert.deepStrictEqual(session.data, {fe: {}, be: {redirect: '/home'}});
        }
      });
    });
  });

  it('basic staff flow works', async () => {
    const dbTestProvider = testDbProviderCtor({
      kind: 'STAFF',
      application_name: 'sessionCreate/basics'
    });

    // main difference is staff do not have an ivkey

    await dbTestProvider(`-test-`, db => {
      return db.tx({}, async db => {
        let loginId: string;
        let sessionId: string;

        // thread everything through one transaction; test provider rolls back by default.
        const dbProvider = <T>(_: string, cb: (db: dbType) => Promise<T>, __?: string) => cb(db);
        const dbProviderCtx = <T>(cb: (db: dbType) => Promise<T>) => cb(db);
        await db.none(`set local "stime.now" to '2022-01-01T00:00:00Z';set local "stime.now_inc" to '1 second';`);

        {
          const ctx: any = {
            sessionId: "",
            dbProvider,
            dbProviderCtx,
          };

          await sessionCreate(ctx);
          sessionId = ctx.sessionId;
          assert.strictEqual(sessionId.length, 43);

          const session: any = await dbProviderCtx(db => db.one(
            `select
               login_id,
               data,
               created_at :: text as created_at,
               expire_at :: text as expire_at
             from
               session
             where
               session_id = func.stuid_from_compact($(sessionId));`
            , {sessionId}));

          assert.strictEqual(session.created_at, "2022-01-01 00:00:00+00");
          assert.strictEqual(session.expire_at, "2022-01-01 01:00:01+00");
          assert.deepStrictEqual(session.data, null);
          assert(!session.login_id);
        }

        {
          // create a user
          const login = await dbProviderCtx(db => {
            return db.one<{ login_id: string }>(`
              insert into
                login (login, display_name, locale_name)
              values
                ('sfool', 'sfood', 'en')
              returning func.tuid6_to_compact(login_id) as login_id;`);
          });

          assert(login);
          loginId = login.login_id;
        }

        {
          // update session after login to contain the login id.
          const ctx: any = {
            sessionId,
            dbProvider,
            dbProviderCtx,
            user: {loginId}
          };

          await sessionUpdate(ctx);

          const session: any = await dbProviderCtx(db => db.one(
            `select
               tuid6_to_compact(login_id) as login_id
             from
               session
             where
               session_id = func.stuid_from_compact($(sessionId));`,
            {sessionId},
          ));
          assert.strictEqual(session.login_id, loginId);
        }

        {
          // verify session on subsequent requests
          const ctx: any = {
            sessionId,
            dbProvider,
            dbProviderCtx
          };

          await sessionVerify(ctx);

          const session: any = await dbProviderCtx(db => db.one(
            `select
               tuid6_to_compact(login_id) as login_id
             from
               session
             where
               session_id = func.stuid_from_compact($(sessionId));`,
            {sessionId}
          ));

          assert.strictEqual(session.login_id, loginId);
        }

        {
          // remove session so we are sure to get a new one
          const ctx: any = {
            sessionId,
            dbProvider,
            dbProviderCtx
          };
          await sessionDelete(ctx);
        }

        {
          // new session
          const ctx: any = {
            dbProvider,
            dbProviderCtx,
          };

          await sessionVerify(ctx); // Verify will create if no sessionId is given,
          assert.notEqual(sessionId, ctx.sessionId);
          sessionId = ctx.sessionId;

          const session: any = await dbProviderCtx(db => db.one(
            `select
               login_id
             from
               session
             where
               session_id = func.stuid_from_compact($(sessionId));`,
            {sessionId}
          ));

          assert(!session.login_id);
        }

        {
          // update session after login to contain the login id.
          const ctx: any = {
            sessionId,
            dbProvider,
            dbProviderCtx,
            session: {fe: {}, be: {redirect: '/home'}},
            user: {loginId}
          };

          await sessionUpdate(ctx);

          const session: any = await dbProviderCtx(db => db.one(
            `select
               data
             from
               session
             where
               session_id = func.stuid_from_compact($(sessionId));`,
            {sessionId},
          ));

          // session data is saved
          assert.deepStrictEqual(session.data, {fe: {}, be: {redirect: '/home'}});
        }

        {
          // expired session
          const ctx: any = {
            sessionId: 'AX_KsdSnQHN3VFcoCvee-kfsYEnET286x4DE0aFqg6Q',
            dbProvider,
            dbProviderCtx,
          };

          await sessionVerify(ctx); // Verify will create if no sessionId finds no valid session
          assert.notEqual(sessionId, ctx.sessionId);
        }

        {
          // sessionId is invalid
          const ctx: any = {
            sessionId: 'AX',
            dbProvider,
            dbProviderCtx,
          };

          await sessionVerify(ctx); // Verify will create if sessionId is not a valid sessionId.
          assert.notEqual(sessionId, ctx.sessionId);
        }

        {
          // sessions expire
          const {n0} = await db.one<{ n0: number }>('select count(session_id) as n0 from session;');
          assert(+n0 > 0);
          await db.none(`set local "stime.now" to '2022-02-01T00:00:00Z';set local "stime.now_inc" to '1 second';`);

          await sessionExpire(dbProvider);
          // pgPromise returns counts as strings because they are 64-bit and may not fit in a ieee double.
          const {n1} = await db.one<{ n1: number }>('select count(session_id) as n1 from session;');
          assert.strictEqual(+n1, 0);
        }
      });
    });
  });

  it("throws if no session_id assigned", async () => {
    const {dbProvider, db} = dbProviderStub(sinon);
    db.one.resolves({});
    const ctx: any = {
      dbProvider,
    }

    try {
      await sessionCreate(ctx);
      assert.fail("did not throw");
    } catch {
      assert.ok(true);
    }
  });
});
