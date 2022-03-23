import * as assert from 'assert';
import {normalizeEmail} from './normalize_email'

describe('normalizeEmail', () => {
  it('Converts to lowercase', () => {
    let result = normalizeEmail('JOHNNY@CIDI.TEST');
    assert.strictEqual(result, 'johnny@cidi.test');

    result = normalizeEmail('johnny@cidi.TEST');
    assert.strictEqual(result, 'johnny@cidi.test');
  });

  it('Strips periods from the user part only', () => {
    let result = normalizeEmail('johnny.cash+june@cidi.test.testing');
    assert.strictEqual(result, 'johnnycash+june@cidi.test.testing');

    result = normalizeEmail('johnny.cash');
    assert.strictEqual(result, 'johnny.cash');
  });
});
