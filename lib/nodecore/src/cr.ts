import {createHash, createHmac} from 'crypto';
import bcrypt from 'bcryptjs';
import {stuidEpochMilli} from "./stuid";
import {bufferXor} from "./buffer_xor";
import {secureTokenFactoryType} from "./stoken";

export const crCtor = (
  secureToken: secureTokenFactoryType,
  nowMs: () => number,
  randomBytes: (n: number) => Buffer
) => {
  /*
  -- Setup:
  -- 1. Client starts account step
  -- 2. Server generated N = large Nonce (256bits), sends to client
  -- 3. Client computes HPN = sha512(password,N), sends to server
  -- 4. Server computes Q = bcrypt(HPN, salt) and stores (Username => N, Q, R='')

  note: Q contains the salt as a prefix.

  The client computing H(P,N) avoids sending the password in plain text to us so we can
  never know the original password. However, knowing HPN is enough for an attacker to
  login as the client, so this must still be done on a secure connection and is the weakest
  point in the protocol.

  Storing bcrypt(H(P,N)) instead of bcrypt(password) makes cracking attempts a bit harder if
  an attacker dumps the DB as it's not a common practice so cracking software doesn't
  support it by default.

  N is bigger than the standard bcrypt salt, making the total salt size much larger
  than normal.

  */

  const serverInit = () => {
    const n = randomBytes(32);
    const nb64 = n.toString('base64url');
    return {nb64};
  };


  const serverSetup = (hpnb64: string) => {
    if (hpnb64.length !== 86) {
      throw new Error('INVALID_PARAMETERS');
    }
    const hpn = Buffer.from(hpnb64, 'base64url');
    const salt = bcrypt.genSaltSync();
    const hpns = String.fromCharCode(...hpn);
    const q = bcrypt.hashSync(hpns, salt);
    return {q};
  };

  /*
  -- 11. Client sends login request to server with Username
  -- 12. Server generates R = secureToken
  -- 13. Server updates R associated with Username
  -- 14. Server sends R, salt, and N (looked up from Username) to the client

  R here is basically a once-time-use session key.
  Note: Since R is signed you could skip storing it and rely on only the signature. This would allow multiple
  attempts using the same R up to the time limit given.
  */

  const serverInitChallenge = () => {
    const r = secureToken.create();
    return {r};
  };

  /*
  -- 15. Client computes HPN = sha512(P,N) // originally sent to the server back in setup step 3
  -- 16. Client computes Q = bcrypt(HPN, salt) // never sent on the wire
  -- 17. Client computes Cc = HMAC_sha512(Q, R) // sign Q using R to generated a key
  -- 18. Client computes F = XOR(HPN, Cc) // xor encrypt HPN with key
  -- 19. Client sends F, R and Username to the server

  R, N and the salt are provided by the server.
  HPN here depends on the client knowing the password.
  If an attacker captured HPN in step 3 they'd use it directly, so known HPN is enough to login.
  Q is derived directly from HPN and the salt
  Cc is the symmetric key to xor encrypt HPN against, derived using Q and R (the one time use session key)
  Since cc's derivation includes the password, cc is as hard to guess as the password is.
  F is the xor encrypted HPN using Cc as the key

  F and R are returned to the server.
  */

  const getSalt = (q: string) => q.substring(0, 29);

  /*
  -- 20. Server validates R, and atomically updates Username.R to '' against the R provided, on failure aborts.
         (i.e. only allow the R to be used once to login.)
  -- 21. Server computes Cs = HMAC(Q, R) // sign Q using R to generate a key
  -- 22. Server computes HPN = XOR(F, Cs) //
  -- 23. Server computes bcrypt(HPN, salt) and compares it with Q (looked up from Username)

  R is validated against the user before calling verify

  F comes from the client, R has matched, and Q (which contains the salt as well) comes from the password store based on the user
  Cs is the encryption key derived from R and Q (which we computed in setup, based on the password)
  HPN is decrypted from F using Cs
  if bcrypt(HPN, salt) matches Q the password the client had must be a match.
  */
  const tenMinutesMs = 10 * 60 * 60 * 1000;

  const serverVerify = (fb64: string, r: string, q: string) => {
    const s = secureToken.verify(r);
    if (!s) {
      return false;
    }
    const ts = stuidEpochMilli(s);

    const tenMinutesAgoEpochMs = nowMs() - tenMinutesMs;
    if (ts < tenMinutesAgoEpochMs) {
      return false;
    }
    const f = Buffer.from(fb64, 'base64url');
    const cs = createHmac('sha512', r).update(q).digest();
    const hpn = bufferXor(f, cs);
    const hpns = String.fromCharCode(...hpn);
    const salt = getSalt(q);
    const v = bcrypt.hashSync(hpns, salt);
    return q === v;
  };

  const clientInit = (password: string, nb64: string) => {
    const n = Buffer.from(nb64, 'base64url');
    const hpnb64 = createHash('sha512').update(password).update(n).digest('base64url');
    return {hpnb64: hpnb64};
  };

  const clientResponse = (r: string, nb64: string, salt: string, password: string) => {
    const n = Buffer.from(nb64, 'base64url');
    const hpn = createHash('sha512').update(password).update(n).digest();
    const hpns = String.fromCharCode(...hpn);
    const q = bcrypt.hashSync(hpns, salt);
    const cc = createHmac('sha512', r).update(q).digest();
    const f = bufferXor(hpn, cc);
    const fb64 = f.toString('base64url');
    return {fb64};
  };

  return {
    getSalt,
    serverInit,
    serverSetup,
    serverInitChallenge,
    serverVerify,
    clientInit,
    clientResponse,
  };
}

export type crType = ReturnType<typeof crCtor>;
