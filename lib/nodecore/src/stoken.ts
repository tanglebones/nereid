import {createHmac} from 'crypto';

export const secureTokenFactoryCtor = (secret: string, stuidFactory: () => string) => {
  const create = () => {
    const s = stuidFactory();
    const x = createHmac('sha256', secret);
    x.update(s);
    const digest = x.digest('base64url');
    return `${s}|${digest}`;
  }

  const verify = (token: string | undefined) => {
    if (!token) {
      return;
    }
    const s = token.split('|');
    if (s.length !== 2) {
      return;
    }
    const x = createHmac('sha256', secret);
    x.update(s[0]);
    const digest = x.digest('base64url');
    if (digest === s[1]) {
      return s[0];
    }
  }

  return {create, verify};
}

export type secureTokenFactoryType = ReturnType<typeof secureTokenFactoryCtor>;
