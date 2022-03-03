// istanbul ignore file
// -- wrapper


import pgPromise from 'pg-promise';
import {dbProviderType, dbType} from './db_provider.type';
import {parseConnectionString} from "./parse_connection_string";
import debugCtor from "debug";
import {serializableType} from "@nereid/anycore";

const debug = debugCtor('db');
const dbs: Record<string, dbType> = {};

export function dbProviderCtor(connectionString: string): dbProviderType {
  async function dbProvider<T>(
    auditUser: string,
    callback: (db: dbType) => Promise<T>,
    trackingTag = '',
  ): Promise<T | undefined> {
    const pgPromiseOptions = {
      query:
        (e: { query: string, params: serializableType }) => {
          debug(
            'QUERY: ',
            e.query,
          );
          if (e.params) {
            debug(
              'PARAMS:',
              e.params,
            );
          }
        },
    };
    const {connectionParameters, key} = parseConnectionString(connectionString);
    if (!dbs[key]) {
      debug('db connect:', key);
      dbs[key] = pgPromise(pgPromiseOptions)(connectionParameters);
    }

    const db = dbs[key];

    return db.tx(async (db: dbType) => {
      await db.none(
        'SET local "audit.user" TO $(user); SET local "audit.tracking_tag" TO $(trackingTag); SET local timezone TO \'UTC\';',
        {user: auditUser, trackingTag});
      return callback(db);
    });
  }

  return dbProvider;
}
