// istanbul ignore -- wrapper around node's process exit
// probably not needed, as several process.on event handlers could be used instead.
import {cancellationTokenType} from "@nereid/anycore";

export const exitCtor = (
  process: { on: (event: string, cb: () => void) => void },
  cancellationTokenFactory: () => cancellationTokenType,
) => {
  const exitCancellationToken = cancellationTokenFactory();
  let exitResolve: (value: unknown) => void | undefined;

  const exitPromise = new Promise((r: (value: unknown) => void) => {
    exitResolve = r;
  });

  const onStop = () => {
    exitCancellationToken.requestCancellation();
    exitResolve?.(0);
  };

  process.on('SIGINT', onStop);
  process.on('SIGTERM', onStop);

  const exit = () => {
    onStop();
    return exitPromise;
  }

  return {onExit: exitCancellationToken.onCancelRequested, exit, exitPromise};
}
