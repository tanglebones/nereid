import {delay} from './delay';
import assert from 'assert';
import {resolvedTrue} from './resolved';
import {cancellationTokenType} from "./cancellation_token";

describe('delay', () => {
  it('Delays by the correct amount', async () => {
    const start = Date.now();
    await delay(100);
    const end = Date.now();
    const diff = end - start;

    assert(diff < 150); // can really vary.
    assert(diff >= 100);
  });

  it('Cancellation token is passed', async () => {
    const onCancelRequestedStub = () => {
      onCancelRequestedStub.callCount++;
      return () => {}
    };
    onCancelRequestedStub.callCount = 0;

    const cancellationToken: cancellationTokenType = {
      onCancelRequested: onCancelRequestedStub,
      requestCancellation: () => {},
      isCancellationRequested: false,
      waitForCancellation: () => resolvedTrue,
    }

    const start = Date.now();
    await delay(100, cancellationToken)
    const end = Date.now();
    const diff = end - start;

    assert.strictEqual(onCancelRequestedStub.callCount, 1);
    assert(diff < 110);
    assert(diff >= 100);
  });

  it('Cancellation is requested', async () => {
    const onCancelRequestedStub = () => {
      onCancelRequestedStub.callCount++;
      return () => {}
    };
    onCancelRequestedStub.callCount = 0;

    const cancellationToken: cancellationTokenType = {
      onCancelRequested: onCancelRequestedStub,
      requestCancellation: () => {},
      isCancellationRequested: true,
      waitForCancellation: () => resolvedTrue,
    }

    const start = Date.now();
    await(delay(100, cancellationToken));
    const end = Date.now();
    const diff = end - start;

    assert.strictEqual(onCancelRequestedStub.callCount, 0);
    assert(diff < 10);
    assert(diff >= 0);
  });
});
