import {timerGuard, timerGuardCtor} from './timer_guard';
import * as assert from 'assert';
import * as sinon from 'sinon';

describe('timerGuard', () => {
  it('Does not log fast code that resolves', async () => {
    const onRes = sinon.stub();
    const onRej = sinon.stub();
    const getTimeMs = sinon.stub();
    getTimeMs.onCall(0).returns(1);
    getTimeMs.onCall(1).returns(2);

    const timerGuard = timerGuardCtor(getTimeMs, onRes, onRej);

    const result = await timerGuard(
      (async () => 1)(),
      'log a',
      100
    )
    sinon.assert.notCalled(onRes);
    sinon.assert.notCalled(onRej);

    assert.strictEqual(result, 1);
  });

  it('Does not log fast code that rejects', async () => {
    const onRes = sinon.stub();
    const onRej = sinon.stub();
    const getTimeMs = sinon.stub();
    getTimeMs.onCall(0).returns(1);
    getTimeMs.onCall(1).returns(2);

    const timerGuard = timerGuardCtor(getTimeMs, onRes, onRej);

    try {
      const result = await timerGuard(
        (async () => {
          throw 2;
        })(),
        'log a',
        100
      );
      assert.fail("should not get here.");
    } catch (e) {
      assert.strictEqual(e, 2);
    }

    sinon.assert.notCalled(onRes);
    sinon.assert.notCalled(onRej);
  });

  it('Does log slow code that resolves', async () => {
    const onRes = sinon.stub();
    const onRej = sinon.stub();
    const getTimeMs = sinon.stub();
    getTimeMs.onCall(0).returns(1);
    getTimeMs.onCall(1).returns(300);
    const timerGuard = timerGuardCtor(getTimeMs, onRes, onRej);

    const result = await timerGuard(
      (async () => 3)(),
      'log a',
      100
    )
    sinon.assert.calledWith(onRes, '[RESOLVED 299ms] log a');
    sinon.assert.notCalled(onRej);

    assert.strictEqual(result, 3);
  });

  it('Does log slow code that rejects', async () => {
    const onRes = sinon.stub();
    const onRej = sinon.stub();
    const getTimeMs = sinon.stub();
    getTimeMs.onCall(0).returns(1);
    getTimeMs.onCall(1).returns(400);
    const timerGuard = timerGuardCtor(getTimeMs, onRes, onRej);

    try {
      const result = await timerGuard(
        (async () => {
          throw "4\nline 22";
        })(),
        "log a",
        100
      );
      assert.fail("should not get here.");
    } catch (e) {
      assert.strictEqual(e, "4\nline 22");
    }

    sinon.assert.notCalled(onRes);
    sinon.assert.calledWith(onRej, "[REJECTED 399ms:4 line 22] log a");
  });
});
