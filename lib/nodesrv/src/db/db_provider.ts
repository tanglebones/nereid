// istanbul ignore file
// -- wrapper

import pgPromise from 'pg-promise';
import {dbProviderType, dbType} from './db_provider.type';
import {parseConnectionString} from "./parse_connection_string";
import debugCtor from "debug";

const debug = debugCtor('db');
const dbs: Record<string, dbType> = {};
const rolledBackError = new Error('rolledback');

export const dbProviderCtor = ({
  connectionString,
  application_name,
  preExec,
  rollback
}: { connectionString: string, application_name?: string, preExec?: string, rollback?: boolean }): dbProviderType => {
  let tag = 0;
  async function dbProvider<T>(
    auditUser: string,
    callback: (db: dbType) => Promise<T>,
    trackingTag = '',
  ): Promise<T | undefined> {
    application_name ??= process.env.PGDB_APP_NAME ?? process.env.HOSTNAME ?? `${process.pid}`;
    const {connectionParameters, key} = parseConnectionString(connectionString);
    const aKey = `${application_name} ${key}`;

    if (!dbs[aKey]) {
      const pgPromiseOptions = {
        query(e: {query: string, params?: unknown, ctx?:{tag?: unknown}}) {
          debug('[%s %s]: %s %o', aKey, e.ctx?.tag ?? '', e.query, e.params);
        },
      };

      dbs[aKey] = pgPromise(pgPromiseOptions)({application_name, ...connectionParameters});
    }

    const db = dbs[aKey];

    ++tag;

    let t: T | undefined;
    try {
      await db.tx({tag}, async db => {
        await db.none(`set local "audit.user" to $(user); set local "audit.tracking_tag" to $(trackingTag); set local timezone to \'UTC\'; ${preExec ?? ``}`,
          {user: auditUser, trackingTag}
        );
        t = await callback(db);
        if (rollback) {
          throw rolledBackError;
        }
      });
    } catch (e) {
      if (e !== rolledBackError) {
        throw e;
      }
    }
    return t;
  }

  return dbProvider;
};
