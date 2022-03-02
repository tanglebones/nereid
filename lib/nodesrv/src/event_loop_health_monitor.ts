type setIntervalType = typeof setInterval;
type clearIntervalType = typeof clearInterval;

export const eventLoopHealthMonitorCtor = (
  getTimeMs: () => number,
  setInterval: setIntervalType,
  clearInterval: clearIntervalType,
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

// istanbul ignore next: bootstrap
export const eventLoopHealthMonitor = eventLoopHealthMonitorCtor(
  () => +Date.now(),
  setInterval,
  clearInterval,
  console.error,
  +(process.env.NODE_EVENT_LOOP_HEALTH_MONITOR_INTERVAL || '10000'),
  +(process.env.NODE_EVENT_LOOP_HEALTH_MONITOR_MAX_DRIFT || '100'),
);
