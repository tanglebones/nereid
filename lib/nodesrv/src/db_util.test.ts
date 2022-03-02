import * as sinon from 'sinon';
import * as assert from 'assert';
import {toDbProvideCtx, parseDbTimeStampTZ, parseDbMilliseconds} from './db_util'

describe('toDbProvideCtx', () => {
  it('basics', async () => {
    const dbProvider = sinon.stub();
    const result = toDbProvideCtx('user', 'tag', dbProvider);
       
    // We expect the result to be a function
    // We passed in a dbProvider, but we don't expect anything to have been done with that yet
    assert.strictEqual(typeof result, 'function');
    sinon.assert.notCalled(dbProvider);

    // We also expect the result to have certain behaviour
    const callback = sinon.stub();
    result(callback);
    sinon.assert.calledOnceWithExactly(
      dbProvider,
      'user', callback, 'tag'
    );
    sinon.assert.notCalled(callback);
  });
});

describe('parseDbTimeStampTZ', () => {
  it('returns undefined if input is nullish', () => {
    let result = parseDbTimeStampTZ();
    assert.strictEqual(result, undefined);

    result = parseDbTimeStampTZ('');
    assert.strictEqual(result, undefined);

    result = parseDbTimeStampTZ(undefined);
    assert.strictEqual(result, undefined);
  });

  it('parses from ISO 8601 format', () => {
    // The subject does not accept a timestamptz straight from the DB,
    // we needs to convert to a parsable ISO 8601 format: https://moment.github.io/luxon/docs/manual/parsing.html
    // One possibility of how to do it:
    // SELECT trim(both '"' from to_json(now())::text); -- 2021-04-09T17:06:36.645276+00:00
    // I don't find any usages yet, so won't go too in-depth on this test

    let result = parseDbTimeStampTZ('2021-04-09T17:06:36.645276+00:00');
    assert.strictEqual(result?.year, 2021);
    assert.strictEqual(result?.month, 4);
  });
});

describe('parseDbMilliseconds', () => {
  it('returns undefined if input is nullish', () => {
    let result = parseDbMilliseconds();
    assert.strictEqual(result, undefined);

    result = parseDbMilliseconds('');
    assert.strictEqual(result, undefined);

    result = parseDbMilliseconds(undefined);
    assert.strictEqual(result, undefined);
  });

  it('parses milliseconds', () => {
    // Again, I don't find any usages yet, so won't go too in-depth on this test

    let result = parseDbMilliseconds('1542674993410');
    assert.strictEqual(result?.milliseconds, 1542674993410);
  });
});
