export const tuidHexToBase64url = (s: string) => Buffer.from(s, "hex").toString("base64url");
export const tuidBase64urlToHex = (s: string) => Buffer.from(s, "base64url").toString("hex");

/**
 * Returns a 128bit time prefixed (48 bits) random (80 bits) identifier encoded as hex (by default)
 * Suitable for distributed system identifier generation.
 * Hard to guess (sparse), increasing security
 * Semi-monotonic, avoiding index performance issues seen by purely random identifiers
 * Ideally stored as a fixed length binary field in the DB. If using a varchar or transmitting via a string
 * the more compact base64url encoding should be used.
 *
 * @param randomFillSync matches https://nodejs.org/api/crypto.html#cryptorandomfillsyncbuffer-offset-size
 * @param nowMs returns the current milliseconds since unix epoc
 */
export const tuidFactoryCtor = (
  randomFillSync: (buffer: Buffer, offset: number, count: number) => void,
  nowMs: () => number
) => {
  let lastTime = 0n;
  return () => {
    let now = BigInt(nowMs());
    if (now <= lastTime) {
      now = lastTime + 1n;
    }
    lastTime = now;
    const buffer = Buffer.alloc(18);
    buffer.writeBigInt64BE(now, 0); // 8 bytes, of which we use 6 (48 bits)
    randomFillSync(buffer, 8, 10); // 10 bytes (80 bits)
    return buffer.subarray(2, 18).toString("base64url");
  };
}

export const tuidEpochMilli = (tuid: string) => {
  const buffer = Buffer.alloc(18);
  buffer[0] = 0;
  buffer[1] = 0;
  buffer.write(tuid, 2, "base64url");
  const n = buffer.readBigInt64BE(0);
  return Number(n);
};

export const tuidForTestingFactoryCtor = (start = 0) => {
  let n = BigInt(start);
  return () => {
    const buffer = Buffer.alloc(18);
    buffer.writeBigInt64BE(n, 0);
    n += 1n;
    return buffer.subarray(2, 18).toString("base64url");
  };
};

// istanbul ignore next
export const tuidZeroBase64url = tuidHexToBase64url('00000000000000000000000000000000');
