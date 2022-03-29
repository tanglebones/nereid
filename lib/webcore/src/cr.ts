import bcrypt from 'bcryptjs';
import JsSha from 'jssha';
import {
  base64UrlToUint8Array,
  stringToUint8Array,
  uint8ArrayToBase64Url,
  uint8ArrayToString,
  uint8ArrayXor
} from "./uint8arr";

export const crClientInit = (password: string, nb64: string): { hpnb64: string } => {
  const n = base64UrlToUint8Array(nb64);
  const sha512 = new JsSha('SHA-512', 'UINT8ARRAY');

  sha512.update(stringToUint8Array(password));
  sha512.update(n);

  return {hpnb64: sha512.getHash('B64')};
};

export const crClientResponse = (r: string, nb64: string, salt: string, password: string): { fb64: string } => {
  const n = base64UrlToUint8Array(nb64);
  const sha512 = new JsSha('SHA-512', 'UINT8ARRAY');
  sha512.update(stringToUint8Array(password));
  sha512.update(n);

  const hpn = sha512.getHash('UINT8ARRAY');
  const hpns = uint8ArrayToString(hpn);
  const q = bcrypt.hashSync(hpns, salt);
  const hmac512 = new JsSha('SHA-512', 'TEXT', {hmacKey: {value: r, format: 'TEXT'}});
  hmac512.update(q);
  const cc = hmac512.getHash('UINT8ARRAY');
  const f = uint8ArrayXor(hpn, cc);
  const fb64 = uint8ArrayToBase64Url(f);
  return {fb64};
};
