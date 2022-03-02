import {cancellationTokenFactorCtor} from "@nereid/anycore";

const cancellationTokenFactory = cancellationTokenFactorCtor();
const exitCancellationToken = cancellationTokenFactory();

let exitResolve: (value: unknown) => void | undefined;

new Promise((r: (value: unknown) => void) => {
  exitResolve = r;
}).then(() => {
  exitCancellationToken.requestCancellation();
}).catch(()=> {
  exitCancellationToken.requestCancellation();
});

function onStop() {
  exitResolve?.(0);
}

process.on('SIGINT', onStop);
process.on('SIGTERM', onStop);
