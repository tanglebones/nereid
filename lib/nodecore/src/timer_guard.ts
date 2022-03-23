export const timerGuardCtor = (
  getTimeMs: () => number,
  resolvedLogger: (message: string) => void,
  rejectedLogger: (message: string) => void,
) =>
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async <T>(promise: Promise<T>,
    message: string,
    logOverMs: number
  ) => {
    const start = getTimeMs();
    try {
      const res = await promise;
      const elapsed = getTimeMs() - start;
      if (elapsed > logOverMs) {
        resolvedLogger(`[RESOLVED ${elapsed}ms] ${message}`);
      }
      return res;
    } catch (err) {
      const elapsed = getTimeMs() - start;
      if (elapsed > logOverMs) {
        rejectedLogger(`[REJECTED ${elapsed}ms:${(err as Error)?.toString()?.replace(/[\r\n]/g, ' ')}] ${message}`);
      }
      throw err;
    }
  }

// const timerGuard = timerGuardCtor(() => +Date.now(), console.log, console.error);
