import {cancellationTokenType} from "./cancellation_token";

export const delay = async (milliseconds: number, cancellationToken?: cancellationTokenType) => new Promise<void>(
  (r) => {
    if (cancellationToken) {
      if (cancellationToken.isCancellationRequested) {
        r();
        return;
      }
      cancellationToken.onCancelRequested(r);
    }
    setTimeout(r, milliseconds);
  });
