import {h64} from 'xxhashjs';

export const signature = (xs: Iterable<string>) => {
  const h = h64();
  for (const x of xs) {
    h.update(x);
  }
  return h.digest().toString(16).padStart(16, '0');
};

export const signatureObjectKeys = (x: Readonly<Record<string, unknown>>) => signature(Object.keys(x).sort());

