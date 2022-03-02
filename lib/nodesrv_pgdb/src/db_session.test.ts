import * as assert from 'assert';
import {serverSettingsType, userInfoType} from './../server.type';
import {sessionCreate, sessionVerify, sessionUpdate, sessionDelete, sessionExpire} from './db_session';
import {value as createSql} from './db_session_create.sql';
import {value as deleteSql} from './db_session_delete.sql';
import {value as expireSql} from './db_session_expire.sql';
import {value as updateClientSql} from './db_session_update_client.sql';
import {value as updateStaffSql} from './db_session_update_staff.sql';
import {value as verifyClientSql} from './db_session_verify_client.sql';
import {value as verifyStaffSql} from './db_session_verify_staff.sql';
import {resolvedUndefined} from 'ts_agnostic';

describe('sessionCreate', () => {
  const setup = (dbResultMock: object) => {
    const dbProviderStub = (auditUser, callback, trackingTag) => {
      dbProviderStub.callCount++;
      callback(dbStub).catch(error => dbProviderStub.error = error);
      return resolvedUndefined;
    };
    dbProviderStub.callCount = 0;
    dbProviderStub.error = null;

    const dbOneStub = query => {
      dbOneStub.callCount++;
      dbOneStub.calledWith = query;
      return dbResultMock;
    };
    dbOneStub.callCount = 0;
    dbOneStub.calledWith = null;

    const dbStub = () => resolvedUndefined;
    dbStub.one = dbOneStub;
    
    const ctxStub = {
      sessionId: '',
      session: {'': ''},
      dbProvider: dbProviderStub,
      db: dbStub,
    }

    return {ctxStub, dbProviderStub, dbStub};
  }

  it('happy path', async () => {
    const {ctxStub, dbProviderStub, dbStub} = setup({session_id: 'session_id_mock'});
    
    await sessionCreate(ctxStub);
    assert.strictEqual(dbProviderStub.callCount, 1);
    assert.strictEqual(dbStub.one.callCount, 1);
    assert.strictEqual(dbStub.one.calledWith, createSql);
    assert.strictEqual(ctxStub.sessionId, 'session_id_mock');
    assert.deepStrictEqual(ctxStub.session, {}); // {} from hardcoded value in subject
    assert.strictEqual(dbProviderStub.error, null);
  });

  it('Error - could not create a session', async () => {
    const {ctxStub, dbProviderStub, dbStub} = setup({});

    await sessionCreate(ctxStub);
    assert.strictEqual(dbProviderStub.callCount, 1);
    assert.strictEqual(dbStub.one.callCount, 1);
    assert.strictEqual(dbStub.one.calledWith, createSql);
    assert.strictEqual(ctxStub.sessionId, '');
    assert.deepStrictEqual(ctxStub.session, {'': ''});
    assert.strictEqual(dbProviderStub.error.message, 'could not create a new session.');
  });
});

describe('sessionVerify', () => {
  const setup = (args: {
    dbResultMock: object | null,
    sessionIdMock: string,
    userMock: object | null,
    modeMock: 'client' | 'staff',
  }) => {
    const {dbResultMock, sessionIdMock, userMock, modeMock} = args

    const dbProviderStub = (auditUser, callback, trackingTag) => {
      dbProviderStub.callCount++;
      callback(dbStub);
      return resolvedUndefined;
    };
    dbProviderStub.callCount = 0;

    const dbOneOrNoneStub = (...params) => {
      dbOneOrNoneStub.calledWith = params;
      dbOneOrNoneStub.callCount++;
      return dbResultMock;
    };
    dbOneOrNoneStub.callCount = 0;
    dbOneOrNoneStub.calledWith = null;

    const dbStub = () => resolvedUndefined;
    dbStub.oneOrNone = dbOneOrNoneStub;

    const ctxStub = {
      sessionId: sessionIdMock,
      session: {'': ''},
      dbProvider: dbProviderStub,
      user: null || <userInfoType>userMock,
      db: dbStub,
      settings: <serverSettingsType>{
        host: 'settings_host_mock',
        port: 'settings_port_mock',
        schema: 'settings_schema_mock',
        mode: modeMock,
        appUrl: 'settings_appUrl_mock',
        dbConnectionString: 'settings_dbConnectionString_mock',
      }
    }

    return {ctxStub, dbProviderStub, dbStub};
  };

  it('Happy path - client', async () => {
    const {ctxStub, dbProviderStub, dbStub} = setup({
      dbResultMock: {
        login: 'db_result_login_mock',
        client_profile_id: 'db_result_client_profile_id_mock',
        federated_login_id: 'db_result_federated_login_id_mock',
        data: 'db_result_data_mock',
      },
      sessionIdMock: 'session_id_mock',
      userMock: {login: 'user_login_mock'},
      modeMock: 'client',
    });

    await sessionVerify(ctxStub);
    assert.strictEqual(dbProviderStub.callCount, 1);
    assert.strictEqual(dbStub.oneOrNone.callCount, 1);
    assert.deepStrictEqual(dbStub.oneOrNone.calledWith, [
      verifyClientSql,
      {sessionId: 'session_id_mock'},
    ]);
    assert.strictEqual(ctxStub.user.login, 'db_result_login_mock');
    assert.strictEqual(ctxStub.user.clientProfileId, undefined);
    assert.strictEqual(ctxStub.user.federatedLoginId, undefined);
    assert.strictEqual(ctxStub.session, 'db_result_data_mock');
  });

  it('Happy path - staff', async () => {
    const {ctxStub, dbProviderStub, dbStub} = setup({
      dbResultMock: {
        login: 'db_result_login_mock',
        client_profile_id: 'db_result_client_profile_id_mock',
        federated_login_id: 'db_result_federated_login_id_mock',
        data: 'db_result_data_mock',
      },
      sessionIdMock: 'session_id_mock',
      userMock: {login: 'user_login_mock'},
      modeMock: 'staff',
    });

    await sessionVerify(ctxStub);
    assert.strictEqual(dbProviderStub.callCount, 1);
    assert.strictEqual(dbStub.oneOrNone.callCount, 1);
    assert.deepStrictEqual(dbStub.oneOrNone.calledWith, [
      verifyStaffSql,
      {sessionId: 'session_id_mock'},
    ]);
    assert.strictEqual(ctxStub.user.login, 'db_result_login_mock');
    assert.strictEqual(ctxStub.user.clientProfileId, undefined);
    assert.strictEqual(ctxStub.user.federatedLoginId, undefined);
    assert.strictEqual(ctxStub.session, 'db_result_data_mock');
  });

  it('Session and user do not exist', async () => {
    const {ctxStub, dbProviderStub, dbStub} = setup({
      dbResultMock: {
        login: 'db_result_login_mock',
        client_profile_id: 'db_result_client_profile_id_mock',
        federated_login_id: 'db_result_federated_login_id_mock',
        data: 'db_result_data_mock',
      },
      sessionIdMock: '',
      userMock: null,
      modeMock: 'client',
    });

    await sessionVerify(ctxStub);
    assert.strictEqual(dbProviderStub.callCount, 2); // because sessionCreate called it too
    assert.strictEqual(dbStub.oneOrNone.callCount, 1);
    assert.deepStrictEqual(dbStub.oneOrNone.calledWith, [
      verifyClientSql,
      {sessionId: ''},
    ]);
    assert.strictEqual(ctxStub.user.login, 'db_result_login_mock');
    assert.strictEqual(ctxStub.user.clientProfileId, 'db_result_client_profile_id_mock');
    assert.strictEqual(ctxStub.user.federatedLoginId, 'db_result_federated_login_id_mock');
    assert.strictEqual(ctxStub.session, 'db_result_data_mock');
  });

  it('No result from DB', async () => {
    const {ctxStub, dbProviderStub, dbStub} = setup({
      dbResultMock: null,
      sessionIdMock: 'session_id_mock',
      userMock: {login: 'user_login_mock'},
      modeMock: 'client',
    });

    await sessionVerify(ctxStub);
    assert.strictEqual(dbProviderStub.callCount, 2); // because sessionCreate called it too
    assert.strictEqual(dbStub.oneOrNone.callCount, 1);
    assert.deepStrictEqual(dbStub.oneOrNone.calledWith, [
      verifyClientSql,
      {sessionId: 'session_id_mock'},
    ]);
    assert.strictEqual(ctxStub.user.login, 'user_login_mock');
    assert.strictEqual(ctxStub.user.clientProfileId, undefined);
    assert.strictEqual(ctxStub.user.federatedLoginId, undefined);
    assert.deepStrictEqual(ctxStub.session, {'': ''});
  });
});

describe('sessionUpdate', () => {
  const setup = (args: {
    sessionIdMock: string,
    userMock: object | null,
    modeMock: 'client' | 'staff',
  }) => {
    const {sessionIdMock, userMock, modeMock} = args

    const dbProviderStub = (auditUser, callback, trackingTag) => {
      dbProviderStub.callCount++;
      callback(dbStub);
      return resolvedUndefined;
    };
    dbProviderStub.callCount = 0;

    const dbResultStub = (...params) => {
      dbResultStub.callCount++;
      dbResultStub.calledWith = params;
    };
    dbResultStub.callCount = 0;
    dbResultStub.calledWith = null;

    const dbStub = () => resolvedUndefined;
    dbStub.result = dbResultStub;

    const ctxStub = {
      sessionId: sessionIdMock,
      session: {'': ''},
      dbProvider: dbProviderStub,
      user: null || <userInfoType>userMock,
      settings: <serverSettingsType>{
        host: 'settings_host_mock',
        port: 'settings_port_mock',
        schema: 'settings_schema_mock',
        mode: modeMock,
        appUrl: 'settings_appUrl_mock',
        dbConnectionString: 'settings_dbConnectionString_mock',
      }
    }

    return {ctxStub, dbProviderStub, dbStub};
  };

  it('Happy path - client', async () => {
    const {ctxStub, dbProviderStub, dbStub} = setup({
      sessionIdMock: 'session_id_mock',
      userMock: {login: 'user_login_mock'},
      modeMock: 'client',
    });

    await sessionUpdate(ctxStub);
    assert.strictEqual(dbProviderStub.callCount, 1);
    assert.strictEqual(dbStub.result.callCount, 1);
    assert.deepStrictEqual(dbStub.result.calledWith, [
      updateClientSql,
      {
        sessionId: 'session_id_mock',
        data: {'': ''},
        login: 'user_login_mock',
        clientProfileId: undefined,
        federatedLoginId: undefined,
      }
    ]);
  });

  it('Happy path - staff', async () => {
    const {ctxStub, dbProviderStub, dbStub} = setup({
      sessionIdMock: 'session_id_mock',
      userMock: {login: 'user_login_mock'},
      modeMock: 'staff',
    });

    await sessionUpdate(ctxStub);
    assert.strictEqual(dbProviderStub.callCount, 1);
    assert.strictEqual(dbStub.result.callCount, 1);
    assert.strictEqual(dbStub.result.calledWith[0], updateStaffSql);
    assert.deepStrictEqual(dbStub.result.calledWith, [
      updateStaffSql,
      {
        sessionId: 'session_id_mock',
        data: {'': ''},
        login: 'user_login_mock',
      }
    ]);
  });

  it('Session does not exist', async () => {
    const {ctxStub, dbProviderStub, dbStub} = setup({
      sessionIdMock: '',
      userMock: null,
      modeMock: 'client',
    });

    await sessionUpdate(ctxStub);
    // early return, nothing happens!
    assert.strictEqual(dbProviderStub.callCount, 0);
    assert.strictEqual(dbStub.result.callCount, 0);
  });
});

describe('sessionDelete', () => {
  const setup = (sessionIdMock) => {
    const dbProviderStub = (auditUser, callback, trackingTag) => {
      dbProviderStub.callCount++;
      callback(dbStub);
      return resolvedUndefined;
    };
    dbProviderStub.callCount = 0;

    const dbResultStub = (...params) => {
      dbResultStub.callCount++;
      dbResultStub.calledWith = params;
    };
    dbResultStub.callCount = 0;
    dbResultStub.calledWith = null;

    const dbStub = () => resolvedUndefined;
    dbStub.result = dbResultStub;

    const ctxStub = {
      sessionId: sessionIdMock,
      dbProvider: dbProviderStub,
    }

    return {ctxStub, dbProviderStub, dbStub};
  };
  
  it('Happy path', async () => {
    const {ctxStub, dbProviderStub, dbStub} = setup('session_id_mock');

    await sessionDelete(ctxStub);
    assert.strictEqual(dbProviderStub.callCount, 1);
    assert.strictEqual(dbStub.result.callCount, 1);
    assert.deepStrictEqual(dbStub.result.calledWith, [
      deleteSql,
      {sessionId: 'session_id_mock'}
    ]);
  });
});

describe('sessionExpire', () => {
  const setup = () => {
    const dbProviderStub = (auditUser, callback, trackingTag) => {
      dbProviderStub.callCount++;
      callback(dbStub);
      return resolvedUndefined;
    };
    dbProviderStub.callCount = 0;

    const dbResultStub = (...params) => {
      dbResultStub.callCount++;
      dbResultStub.calledWith = params;
    };
    dbResultStub.callCount = 0;
    dbResultStub.calledWith = null;

    const dbStub = () => resolvedUndefined;
    dbStub.result = dbResultStub;

    return {dbProviderStub, dbStub};
  };
  
  it('Happy path', async () => {
    const {dbProviderStub, dbStub} = setup();

    await sessionExpire(dbProviderStub);
    assert.strictEqual(dbProviderStub.callCount, 1);
    assert.strictEqual(dbStub.result.callCount, 1);
    assert.deepStrictEqual(dbStub.result.calledWith, [expireSql]);
  });
});
