import {hexToUint8Array, uint8ArrayToBase64Url} from "./uint8arr";

export const tuidFactoryCtor = (window: Window, nowMs: () => number) =>
  () => {
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes); // don't try and pass a ref to this function, it'll fail. Probably some security reason.
    const utcMs = nowMs();
    const timeBytes = hexToUint8Array(utcMs.toString(16).padStart(12, '0'));
    for (let i = 0; i < 6; ++i) {
      bytes[i] = timeBytes[i];
    }
    return uint8ArrayToBase64Url(bytes);
  }
