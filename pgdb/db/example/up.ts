#!/usr/bin/env ts-node
import {main} from '../../lib/node_script/src/main';
import * as debugCtor from 'debug';
import * as fs from 'fs';
import * as path from 'path';
import * as pgPromise from 'pg-promise';

const debug = debugCtor('db:migration');

const pgPromiseOptions = {
  query:
    (e) => {
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
const pgp = pgPromise(pgPromiseOptions);
const databaseUrl = process.env.DB_FORMATION_DBA_URL;
const testDatabaseUrl = process.env.DB_FORMATION_DBA_URL_TEST;

main(async () => {
  if (!databaseUrl) {
    console.log('DB_FORMATION_DBA_URL environment variables must be set.');
    process.exit(-1);
  } else {
    console.log('Migrating db.');
    const db = pgp(databaseUrl);
    await doMigrations(db, fs, path);
  }
  if (testDatabaseUrl) {
    console.log('Migrating TEST db.');
    const db = pgp(testDatabaseUrl);
    await doMigrations(db, fs, path);
  }
});

async function doMigrations(db, fs, path) {
  await db.tx(async (db) => {
    const baseDataMigrationsDir = './migration/';
    const migrationsPresentInDirectory = fs.readdirSync(baseDataMigrationsDir).filter((filename) => filename.endsWith('.sql'));
    if (migrationsPresentInDirectory.length === 0) {
      return;
    }

    const migrationsPresentInDb = await db.any(`SELECT * meta.migration m;`);
    const migrationsPresentInDbAsLookup: { [key: string]: boolean } = {};
    migrationsPresentInDb.forEach(m => migrationsPresentInDbAsLookup[m] = true);

    for (const migration_identifier of migrationsPresentInDirectory.filter(m => !migrationsPresentInDbAsLookup[m])) {
      const contents = fs.readFileSync(path.join(baseDataMigrationsDir, migration_identifier), 'utf-8');
      try {
        await db.none(contents);
      } catch (e) {
        console.log(`${migration_identifier} not applied do to error:
${e}`);
        continue;
      }
      await db.none(`INSERT INTO meta.migration VALUES ($(migration_identifier))`, {migration_identifier});
    }
    if (process.env.DRY_RUN !== undefined) {
      throw new Error('Rollback');
    }
  });
}
