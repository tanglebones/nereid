export interface PromiseState<T> extends Promise<T> {
  isPending: boolean;
  isRejected: boolean;
  isResolved: boolean;
}

export const promiseStateCtor = <T>(promise: Promise<T>) => {
  let isPending = true;
  let isRejected = false;
  let isResolved = false;

  const result = promise.then(
    function (res) {
      isPending = false;
      isResolved = true;
      return res;
    },
    function (rej) {
      isPending = false;
      isRejected = true;
      throw rej;
    },
  );

  Object.defineProperty(result, 'isResolved', {
    get() {
      return isResolved;
    },
  });
  Object.defineProperty(result, 'isRejected', {
    get() {
      return isRejected;
    },
  });
  Object.defineProperty(result, 'isPending', {
    get() {
      return isPending;
    },
  });

  return result as PromiseState<T>;
};
