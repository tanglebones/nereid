import {parseConnectionString} from "./parse_connection_string";
import assert from "assert";

describe("parseConnectionString", () => {
  it("basics", () => {
    const cp = parseConnectionString("postgres://user:password@host:1234/dbname");
    assert.deepStrictEqual(cp, {
      connectionParameters: {
        database: 'dbname',
        host: 'host',
        port: 1234,
        user: 'user',
        password: 'password',
        ssl: {rejectUnauthorized: false},
      },
      key: "user@host:1234/dbname",
    });
  });
  it("localhost", () => {
    const cp = parseConnectionString("postgres://user:password@localhost:1234/dbname");
    assert.deepStrictEqual(cp, {
      connectionParameters: {
        database: 'dbname',
        host: 'localhost',
        port: 1234,
        user: 'user',
        password: 'password',
        ssl: false,
      },
      key: "user@localhost:1234/dbname",
    });
  });
  it("invalid", () => {
    assert.throws(() => parseConnectionString("postgres://user:password@host/dbname"));
  });
});
