import {cancellationTokenType} from "./cancellation_token";

export const delay = async (milliseconds: number, cancellationToken?: cancellationTokenType) => new Promise<void>(
  (r) => {
    let unsub: () => void;
    if (cancellationToken) {
      if (cancellationToken.isCancellationRequested) {
        r();
        return;
      }
      unsub = cancellationToken.onCancelRequested(r);
    }
    setTimeout(() => {
      unsub?.();
      r();
    }, milliseconds);
  });
