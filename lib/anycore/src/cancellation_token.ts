import {entitiesOrderedByKeyReversed} from "./entries_ordered_by_key";

export type cancellationCallbackType = () => void;

export type cancellationTokenType = {
  onCancelRequested: (callback: cancellationCallbackType) => () => void,
  requestCancellation: () => void,
  isCancellationRequested: boolean,
  waitForCancellation: (timeoutMilliseconds?: number) => Promise<boolean>,
};

export const cancellationTokenFactoryCtor = () => {
  let id = 1;
  return () => {
    let cancellationCallbacks = {} as Record<string, cancellationCallbackType>;
    let isCancellationRequested = false;

    const onCancelRequested = (callback: cancellationCallbackType) => {
      console.assert(callback);
      const x = (id++).toString(16).padStart(16, '0');
      cancellationCallbacks[x] = callback;
      return () => delete cancellationCallbacks[x];
    }

    const requestCancellation = () => {
      if (!isCancellationRequested) {
        entitiesOrderedByKeyReversed(Object.entries(cancellationCallbacks))
          .map(x => x[1])
          .forEach((cb) => cb());
        cancellationCallbacks = {};
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
