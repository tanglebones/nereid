import {pad} from 'ts_agnostic';
import {randomBytes} from 'crypto';

let lastTime = 0;

const rhc = function rhc(n: number): string {
  return randomBytes(n).toString('hex');
};

export const stuidCtor = () => {
  let now = Date.now() * 1000; // microseconds
  if (now <= lastTime) {
    // because the JS time resolution isn't great we force time
    // forward to preserve generation order locally.
    now = lastTime + 1;
  }
  lastTime = now;

  const ts = pad('0000000000000000', now.toString(16));
  return ts + rhc(24);
}

export type stuidCtorType = typeof stuidCtor;

export function isStuid(stuid:string): boolean {
  return !!stuid.match(/^[0-9A-Fa-f]{64}$/);
}

export function stuidEpochMicro(value: string): number|undefined {
  const m = value.match(/^([0-9a-fA-F]{16})[0-9a-fA-F]{48}$/);
  if (!m) { return; }
  return Number.parseInt(m[1], 16);
}

export const stuidZero = '0000000000000000000000000000000000000000000000000000000000000000';

// istanbul ignore next
export function stuidCtorForTesting(start = 0): () => string {
  return () => {
    const h = pad('0000000000000000', (start++).toString(16));
    return `000100000000000000000000000000000000000000000000${h}`;
  };
}

