import {createHmac} from 'crypto';

export const secureTokenFactoryCtor = (secret: string, stuidFactory: () => string) => {
  const create = () => {
    const s = stuidFactory().substring(0, 64).padStart(64, '0');
    const x = createHmac('sha256', secret);
    x.update(s);
    const digest = x.digest('hex').substring(0, 64).padStart(64, '0');
    return s + digest;
  }

  const verify = (token: string | undefined) => {
    if (!token) {
      return;
    }
    const s = token.substring(0, 64);
    const e = token.substring(64);
    const x = createHmac('sha256', secret);
    x.update(s);
    const digest = x.digest('hex');
    if (digest === e) {
      return s;
    }
  }

  return {create, verify};
}

export type secureTokenFactoryType = ReturnType<typeof secureTokenFactoryCtor>;