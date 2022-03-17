import {uint8ArrayToHex} from "./to_hex";

export const tuidFactory = (nowMs: () => number = () => +Date.now(), randomValues: (array: Uint8Array) => void = window.crypto.getRandomValues) => {
  const rndBytes = new Uint8Array(20);
  randomValues(rndBytes)
  return nowMs().toString(16).padStart(12, '0') + uint8ArrayToHex(rndBytes);
}
