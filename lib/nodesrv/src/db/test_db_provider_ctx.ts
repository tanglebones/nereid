// istanbul ignore file -- only used in tests

import {dbProviderCtor} from "./db_provider";

export const testDbProviderCtor = (
  {
    preExec, kind, rollback, application_name
  }: {
    preExec?: string, kind?: string, rollback?: boolean, application_name?: string
  }
) => {
  kind ??= 'app';
  rollback ??= true;
  const envKey = `PGDB_URL_TEST_${kind.toUpperCase()}`;
  const connectionString = process.env[envKey];
  if (!connectionString) {
    throw new Error(`${envKey} is not set in process.env`)
  }
  return dbProviderCtor({connectionString, application_name, preExec, rollback});
};

