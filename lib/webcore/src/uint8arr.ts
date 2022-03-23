const byteToHex: string[] = new Array(256);
const lcHexToByte: Record<string, number> = {};

for (let i = 0; i <= 255; ++i) {
  const hexOctet = i.toString(16).padStart(2, "0").toLocaleLowerCase();
  byteToHex[i] = hexOctet;
  lcHexToByte[hexOctet] = i;
}

export const uint8ArrayToHex = (uint8Array: Uint8Array) => {
  const hexOctets = new Array(uint8Array.length);

  for (let i = 0; i < uint8Array.length; ++i)
    hexOctets[i] = byteToHex[uint8Array[i]];

  return hexOctets.join("");
};

export const hexToUint8Array = (hex: string) => {
  const length = hex.length / 2;
  const arr = new Uint8Array(length);

  for (let i = 0; i < hex.length; i += 1) {
    const hi = i*2;
    const h = `${hex[hi]}${hex[hi + 1]}`;
    arr[i] = lcHexToByte[h];
  }

  return arr;
};

export const uint8ArrayToBase64Url = (uint8Array: Uint8Array) => {
  const data = String.fromCharCode.apply(null, uint8Array as unknown as number[]);
  // noinspection JSDeprecatedSymbols
  const b64 = btoa(data);
  return b64.replaceAll('/', '_').replaceAll('+', '-').replaceAll('=', '');
}
