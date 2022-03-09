// istanbul ignore file
const resolvedPromise = <T>(t: T) => new Promise<T>(r => r(t));

export const resolvedVoid = resolvedPromise<void>(void (0));
export const resolvedUndefined = resolvedPromise<undefined>(undefined);
export const resolvedTrue = resolvedPromise(true);
export const resolvedFalse = resolvedPromise(false);
