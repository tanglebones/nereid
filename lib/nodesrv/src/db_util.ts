import {dbProviderType, dbType} from './db';
import {DateTime, Duration} from 'luxon';

export type dbProviderCtxType = <T>(callback: (db: dbType) => Promise<T>) => Promise<T|undefined>;

export function toDbProvideCtx(auditUser: string, trackingTag: string, dbProvider: dbProviderType): dbProviderCtxType {
  return function <T>(callback: (db: dbType) => Promise<T>): Promise<T|undefined> {
    return dbProvider(auditUser, callback, trackingTag);
  }
}

export function parseDbTimeStampTZ(datetime?: string): DateTime | undefined {
  if (!datetime) {
    return undefined;
  }
  try {
    return DateTime.fromISO(datetime);
  } catch {
    // istanbul ignore next
    // -- can't get Luxon to error in testing.
    return undefined;
  }
}

export function parseDbMilliseconds(ms?: string): Duration | undefined {
  if (!ms) {
    return undefined;
  }
  try {
    return Duration.fromMillis(+ms);
  } catch {
    // istanbul ignore next
    // -- can't get Luxon to error in testing.
    return undefined;
  }
}
