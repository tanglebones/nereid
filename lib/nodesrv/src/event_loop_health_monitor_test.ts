import * as sinon from "sinon";
import {eventLoopHealthMonitorCtor} from "./event_loop_health_monitor";

describe("eventLoopHealthMonitor", () => {
  it("works", () => {
    const getTimeMs = sinon.stub();
    const setInterval = sinon.stub();
    const clearInterval = sinon.stub();
    const logger = sinon.stub();
    const periodMs = 1000;
    const maxDriftMs = 100;

    const sut = eventLoopHealthMonitorCtor(
      getTimeMs,
      setInterval,
      clearInterval,
      logger,
      periodMs,
      maxDriftMs,
    );

    getTimeMs.returns(100);
    setInterval.returns(123);

    const close = sut();

    sinon.assert.called(getTimeMs);
    sinon.assert.called(setInterval);
    sinon.assert.notCalled(logger);
    sinon.assert.notCalled(clearInterval);

    getTimeMs.reset();
    getTimeMs.returns(1015);

    const callback = setInterval.args[0][0];
    setInterval.reset();

    callback();

    sinon.assert.called(getTimeMs);
    sinon.assert.notCalled(setInterval);
    sinon.assert.notCalled(logger);
    sinon.assert.notCalled(clearInterval);

    getTimeMs.reset();
    getTimeMs.returns(2300);

    callback();

    sinon.assert.called(getTimeMs);
    sinon.assert.notCalled(setInterval);
    sinon.assert.called(logger);
    sinon.assert.notCalled(clearInterval);

    sinon.assert.calledWith(logger, "EventLoop drift: {\"lastSeen\":1015,\"now\":2300,\"periodMs\":1000,\"drift\":285}");

    getTimeMs.reset();
    logger.reset();

    close();

    sinon.assert.notCalled(getTimeMs);
    sinon.assert.notCalled(setInterval);
    sinon.assert.notCalled(logger);
    sinon.assert.calledWith(clearInterval, 123);
  });
});