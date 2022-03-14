export const bufferXor = (a: Buffer, b: Buffer) => {
  if (!a || !b || !a.length || a.length !== b.length) {
    throw new Error("Invalid Arguments")
  }
  const buffer = Buffer.allocUnsafe(a.length);

  for (let i = 0; i < a.length; ++i) {
    buffer[i] = a[i] ^ b[i];
  }

  return buffer;
};
