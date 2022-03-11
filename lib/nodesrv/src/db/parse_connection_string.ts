export const parseConnectionString = (connectionString: string) => {
  const m = connectionString.match(/^postgres:\/\/(?<user>[^:@]+):(?<password>[^@]+)@(?<host>[^:]+):(?<port>[^/]+)\/(?<database>[^?]+)/);
  if (!m || !m.groups?.user || !m.groups?.password || !m.groups?.host || !m.groups?.port || !m.groups?.database) {
    throw new Error('Invalid connection string: ' + connectionString);
  }
  const user = m.groups.user;
  const host = m.groups.host;
  const port = +m.groups.port;
  const database = m.groups.database;
  const password = m.groups.password;
  const connectionParameters = {
    database,
    host,
    port,
    user,
    password,
    ssl: host === 'localhost' ? false : {rejectUnauthorized: false},
  };
  const key = `${user}@${host}:${port}/${database}`;
  return {connectionParameters, key};
};
