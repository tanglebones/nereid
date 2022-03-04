import {createHash, createHmac, randomBytes} from 'crypto';
import bcrypt from 'bcryptjs';
import {secureTokenCtor, secureTokenVerify} from './stoken';
import {stuidEpochMicro} from './stuid';

function buffer_xor(a: Buffer, b: Buffer) {
  const length = Math.max(a.length, b.length);
  const buffer = Buffer.allocUnsafe(length);

  for (let i = 0; i < length; ++i) {
    buffer[i] = a[i] ^ b[i];
  }

  return buffer;
}

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

export function crServerSetupInit(): { nb64: string } {
  const n = randomBytes(32);
  const nb64 = n.toString('base64');
  return {nb64};
}

export function crClientSetupInitEg(password: string, nb64: string): { hpnb64: string } {
  const n = Buffer.from(nb64, 'base64');
  const hpnb64 = createHash('sha512').update(password).update(n).digest('base64');
  return {hpnb64: hpnb64};
}

export function crServerSetup(hpnb64: string): { q: string } {
  if (hpnb64.length !== 88) {
    throw new Error('INVALID_PARAMETERS');
  }
  const hpn = Buffer.from(hpnb64, 'base64');
  const salt = bcrypt.genSaltSync();
  const hpns = String.fromCharCode(...hpn);
  const q = bcrypt.hashSync(hpns, salt);
  return {q};
}

/*
-- 11. Client sends login request to server with Username
-- 12. Server generates R = secureToken
-- 13. Server updates R associated with Username
-- 14. Server sends R, salt, and N (looked up from Username) to the client

R here is basically a once-time-use session key.
Note: Since R is signed you could skip storing it and rely on only the signature. This would allow multiple
attempts using the same R up to the time limit given.
*/

export function crServerInitChallenge(secret: string): { r: string } {
  const r = secureTokenCtor(secret);
  return {r};
}

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

export function crGetSalt(q: string): string {
  return q.substr(0, 29);
}

export function crClientResponseEg(r: string, nb64: string, salt: string, password: string): { fb64: string } {
  const n = Buffer.from(nb64, 'base64');
  const hpn = createHash('sha512').update(password).update(n).digest();
  const hpns = String.fromCharCode(...hpn);
  const q = bcrypt.hashSync(hpns, salt);
  const cc = createHmac('sha512', r).update(q).digest();
  const f = buffer_xor(hpn, cc);
  const fb64 = f.toString('base64');
  return {fb64};
}

/*
-- 20. Server validates R, and atomically updates Username.R to '' against the R provided, on failure aborts.
       (i.e. only allow the R to be used once to login.)
-- 21. Server computes C_s = HMAC(Q, R) // sign Q using R to generate a key
-- 22. Server computes T_s = XOR(F, C_s) //
-- 23. Server computes H(T_s) and compares it with Q (looked up from Username)

R is validated against the user before calling verify

F comes from the client, R has matched, and Q (which contains the salt as well) comes from the password store based on the user
Cs is the encryption key derived from R and Q (which we computed in setup, based on the password)
HPN is decrypted from F using Cs
if bcrypt(HPN, salt) matches Q the password the client had must be a match.
*/

export function crServerVerify(fb64: string, r: string, q: string, secret: string): boolean {
  const s = secureTokenVerify(r, secret);
  if (!s) {
    return false;
  }
  const ts = stuidEpochMicro(s);
  const tenMinutesAgoEpochMicro = (Date.now() - 10 * 60 * 60) * 1000;
  if (!ts || ts < tenMinutesAgoEpochMicro) {
    return false;
  }

  const f = Buffer.from(fb64, 'base64');
  const cs = createHmac('sha512', r).update(q).digest();
  //console.log('cs', [...cs].map(n => pad('00', n.toString(16))).join(''));
  const hpn = buffer_xor(f, cs);
  //console.log('hpn', [...hpn].map(n => pad('00', n.toString(16))).join(''));
  const hpns = String.fromCharCode(...hpn);
  const salt = crGetSalt(q);
  const v = bcrypt.hashSync(hpns, salt);
  //console.log(v);
  //console.log(q);
  return q === v;
}
