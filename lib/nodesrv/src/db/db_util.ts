import {dbProviderCtxType, dbProviderType, dbType} from './db_provider.type';
import {DateTime, Duration} from 'luxon';

export const toDbProvideCtx = (auditUser: string, trackingTag: string, dbProvider: dbProviderType): dbProviderCtxType =>
  <T>(callback: (db: dbType) => Promise<T>): Promise<T | undefined> =>
    dbProvider(auditUser, callback, trackingTag);

export const parseDbTimeStampTZ = (datetime?: string): DateTime | undefined => {
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
};

export const parseDbMilliseconds = (ms?: string): Duration | undefined => {
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
};
