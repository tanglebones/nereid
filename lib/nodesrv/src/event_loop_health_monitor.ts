export const eventLoopHealthMonitorCtor= <T>(
  getTimeMs: () => number,
  setInterval: (callback: () => void, ms: number) => T,
  clearInterval: (handle: T) => void,
  logger: (msg: string) => void,
  periodMs: number,
  maxDriftMs: number,
) =>
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  () => {
    let lastSeen = getTimeMs();
    const handle = setInterval(
      () => {
        let now = getTimeMs();
        let drift = now - lastSeen - periodMs;
        if (drift < 0) {
          drift = -drift;
        }
        if (drift > maxDriftMs) {
          logger(`EventLoop drift: ${JSON.stringify({lastSeen, now, periodMs, drift})}`);
          now = getTimeMs();
        }
        lastSeen = now;
      },
      periodMs
    );
    return () => {
      clearInterval(handle);
    }
  }

// example usage:
// export const eventLoopHealthMonitor = eventLoopHealthMonitorCtor(
//   () => +Date.now(),
//   setInterval,
//   clearInterval,
//   console.error,
//   +(process.env.NODE_EVENT_LOOP_HEALTH_MONITOR_INTERVAL || '10000'),
//   +(process.env.NODE_EVENT_LOOP_HEALTH_MONITOR_MAX_DRIFT || '100'),
// );
