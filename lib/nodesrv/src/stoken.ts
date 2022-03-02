import {createHmac} from 'crypto';
import {stuidCtor} from './stuid';

export function secureTokenCtor(secret: string): string {
  const s = stuidCtor();
  const x = createHmac('sha256', secret);
  x.update(s);
  return s + x.digest('hex');
}

export type secureTokenCtorType = typeof secureTokenCtor;

export function secureTokenVerify(token: string | undefined, secret: string): string | undefined {
  if (!token) {
    return;
  }
  const s = token.substr(0, 64);
  const e = token.substr(64);
  const x = createHmac('sha256', secret);
  x.update(s);
  if (x.digest('hex') === e) {
    return s;
  }
}

export type secureTokenVerifyType = typeof secureTokenVerify;
