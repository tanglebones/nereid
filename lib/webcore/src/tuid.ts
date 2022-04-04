import {hexToUint8Array, uint8ArrayToBase64Url} from "./uint8arr";

export const tuidFactoryCtor = (window: Window, nowMs: () => number) =>
  () => {
    const bytes = new Uint8Array(16);
    // istanbul ignore else -- jsdom is missing crypto :(
    if (window.crypto?.getRandomValues) {
      // istanbul ignore next -- jsdom is missing crypto :(
      window.crypto.getRandomValues(bytes); // don't try and pass a ref to this function, it'll fail. Probably some security reason.
    } else {
      // istanbul ignore next -- jsdom is missing crypto :(
      for (let i = 0; i < bytes.length; ++i) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }

    const utcMs = nowMs();
    const timeBytes = hexToUint8Array(utcMs.toString(16).padStart(12, '0'));
    for (let i = 0; i < 6; ++i) {
      bytes[i] = timeBytes[i];
    }
    return uint8ArrayToBase64Url(bytes);
  }
