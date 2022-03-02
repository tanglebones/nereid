/**
 * @param f a parameterless function to memoize
 * @returns a function that will call `f` at most once; returning the result of `f`.
 */
export const memoize = <T>(f: () => T) => {
  let v: T;
  let first = true;
  return () => {
    if (first) {
      v = f();
      first = false;
    }
    return v;
  };
};