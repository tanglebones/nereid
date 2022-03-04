import {createHmac} from 'crypto';

export const secureTokenFactoryCtor = (secret: string, stuidFactory: () => string) => {
  const create = () => {
    const s = stuidFactory();
    const x = createHmac('sha256', secret);
    x.update(s);
    return s + x.digest('hex');
  }

  const verify = (token: string | undefined) => {
    if (!token) {
      return;
    }
    const s = token.substring(0, 64);
    const e = token.substring(64);
    const x = createHmac('sha256', secret);
    x.update(s);
    if (x.digest('hex') === e) {
      return s;
    }
  }

  return {create, verify};
}
