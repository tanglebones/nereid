import {IConnectionParameters} from "pg-promise/typescript/pg-subset";

export const parseConnectionString = (connectionString: string): { connectionParameters: IConnectionParameters, key: string } => {
  const m = connectionString.match(/^postgres:\/\/(?<user>[^:@]+)(:(?<password>[^@]+))?@(?<host>[^:]+):(?<port>[^/]+)\/(?<database>[^?]+)/);
  if (!m || !m.groups?.user || !m.groups?.host || !m.groups?.database) {
    throw new Error('Invalid connection string: ' + connectionString);
  }
  const user = m.groups.user;
  const host = m.groups.host;
  const port = +(m.groups.port || '5432');
  const database = m.groups.database;
  const password = m.groups.password || '';
  const connectionParameters: IConnectionParameters = {
    application_name: 'ems',
    database,
    host,
    port,
    user,
    password,
    ssl: host === 'localhost' ? false : {rejectUnauthorized: false},
  };
  const key = `user ${user}, host ${host}:${port} db ${database}`;
  return {connectionParameters, key};
};
export const internal = {parseConnectionString};