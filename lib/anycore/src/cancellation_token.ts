import {registryFactory} from "./registry";
import {entitiesOrderedByKeyReversed} from "./entries_ordered_by_key";

export type cancellationCallbackType = () => void;

export type cancellationTokenType = {
  onCancelRequested: (callback: cancellationCallbackType) => () => void,
  requestCancellation: () => void,
  isCancellationRequested: boolean,
  waitForCancellation: (timeoutMilliseconds?: number) => Promise<boolean>,
};

export const cancellationTokenFactorCtor = () => {
  let id = 1;
  return () => {
    const cancellationCallbacks = registryFactory<cancellationCallbackType>();

    let isCancellationRequested = false;

    const onCancelRequested = (callback: cancellationCallbackType) =>
      cancellationCallbacks.register((id++).toString(16).padStart(16,'0'), callback);

    const requestCancellation = () => {
      if (!isCancellationRequested) {
        entitiesOrderedByKeyReversed(cancellationCallbacks.entries)
          .map(x => x[1])
          .forEach((cb) => cb());
        cancellationCallbacks.clear();
        isCancellationRequested = true;
      }
    };

    // return false if timeout, true otherwise.
    const waitForCancellation = async (timeoutMilliseconds?: number) => {
      if (isCancellationRequested) {
        return true;
      }
      return new Promise(r => {
        const unsub = onCancelRequested(() => {
          r(true);
        });
        if (timeoutMilliseconds) {
          setTimeout(() => {
              unsub();
              r(false);
            },
            timeoutMilliseconds,
          );
        }
      });
    };

    return {
      onCancelRequested,
      requestCancellation,
      waitForCancellation,
      get isCancellationRequested(): boolean {
        return isCancellationRequested;
      },
    } as cancellationTokenType;
  };
}
