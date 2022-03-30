import {base64ToBase64Url, base64UrlToBase64 } from "@nereid/anycore";

const byteToHex: string[] = new Array(256);
const lcHexToByte: Record<string, number> = {};

for (let i = 0; i <= 255; ++i) {
  const hexOctet = i.toString(16).padStart(2, "0").toLocaleLowerCase();
  byteToHex[i] = hexOctet;
  lcHexToByte[hexOctet] = i;
}

export const uint8ArrayToString = (a: Uint8Array): string => String.fromCharCode(...a);
export const stringToUint8Array = (s: string): Uint8Array => {
  const rs = new Uint8Array(s.length);
  for (let i = 0; i < s.length; ++i) {
    rs[i] = s.charCodeAt(i);
  }
  return rs;
};

// noinspection JSDeprecatedSymbols
export const base64UrlToUint8Array = (base64: string) =>
  stringToUint8Array(atob(base64UrlToBase64(base64)));

// noinspection JSDeprecatedSymbols
export const uint8ArrayToBase64Url = (a: Uint8Array) =>
  base64ToBase64Url(btoa(uint8ArrayToString(a)));

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
    const hi = i * 2;
    const h = `${hex[hi]}${hex[hi + 1]}`;
    arr[i] = lcHexToByte[h];
  }

  return arr;
};

//
// export const uint8ArrayToBase64Url = (uint8Array: Uint8Array) => {
//   const data = String.fromCharCode.apply(null, uint8Array as unknown as number[]);
//   // noinspection JSDeprecatedSymbols
//   const b64 = btoa(data);
//   return b64.replaceAll('/', '_').replaceAll('+', '-').replaceAll('=', '');
// }


export const uint8ArrayXor = (a: Uint8Array, b: Uint8Array): Uint8Array => {
  const length = a.length;
  if (length !== b.length) {
    throw new Error('INVALID_PARAMETERS');
  }
  const rs = new Uint8Array(length);

  for (let i = 0; i < length; ++i) {
    rs[i] = a[i] ^ b[i];
  }
  return rs;
};
