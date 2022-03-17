import bcrypt from 'bcryptjs';
import JsSha from 'jssha';

const stringToUint8Array = (s: string): Uint8Array => {
  const rs = new Uint8Array(s.length);
  for (let i = 0; i < s.length; ++i) {
    rs[i] = s.charCodeAt(i);
  }
  return rs;
};

const Uint8ArrayToString = (a: Uint8Array): string => String.fromCharCode(...a);
const decodeBase64ToUint8Array = (base64: string): Uint8Array => stringToUint8Array(atob(base64));
// noinspection JSDeprecatedSymbols
const encodeUint8ArrayToBase64 = (a: Uint8Array): string => btoa(Uint8ArrayToString(a));

const xor = (a: Uint8Array, b: Uint8Array): Uint8Array => {
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

export const crClientInit = (password: string, nb64: string): { hpnb64: string } => {
  const n = decodeBase64ToUint8Array(nb64);
  const sha512 = new JsSha('SHA-512', 'UINT8ARRAY');

  sha512.update(stringToUint8Array(password));
  sha512.update(n);

  return {hpnb64: sha512.getHash('B64')};
};

export const crClientResponse = (r: string, nb64: string, salt: string, password: string): { fb64: string } => {
  const n = decodeBase64ToUint8Array(nb64);
  const sha512 = new JsSha('SHA-512', 'UINT8ARRAY');
  sha512.update(stringToUint8Array(password));
  sha512.update(n);

  const hpn = sha512.getHash('UINT8ARRAY');
  const hpns = Uint8ArrayToString(hpn);
  const q = bcrypt.hashSync(hpns, salt);
  const hmac512 = new JsSha('SHA-512', 'TEXT', {hmacKey: {value: r, format: 'TEXT'}});
  hmac512.update(q);
  const cc = hmac512.getHash('UINT8ARRAY');
  const f = xor(hpn, cc);
  const fb64 = encodeUint8ArrayToBase64(f);
  return {fb64};
};
