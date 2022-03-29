import assert from "assert";
import {hexToUint8Array, uint8ArrayToBase64Url, uint8ArrayToHex, uint8ArrayXor} from "./uint8arr";

describe('uint8Array', () => {
  it("uint8ArrayToBase64Url", () => {
    assert.strictEqual(uint8ArrayToBase64Url(new Uint8Array([0, 0, 0, 0, 0, 0])), "AAAAAAAA");
    const uint8Array = new Uint8Array([0, 0, 1, 250, 134, 255]);
    assert.strictEqual(uint8ArrayToBase64Url(uint8Array), "AAAB-ob_");
    assert.strictEqual(Buffer.from("000001fa86ff", "hex").toString("base64url"), uint8ArrayToBase64Url(uint8Array));
  });

  it("uint8ArrayToHex", () => {
    assert.strictEqual(uint8ArrayToHex(new Uint8Array([0, 0, 0, 0, 0, 0])), "000000000000");
    const uint8Array = new Uint8Array([0, 0, 1, 250, 134, 255]);
    assert.strictEqual(uint8ArrayToHex(uint8Array), "000001fa86ff");
  });

  it("uint8ArrayXor", () => {
    assert.strictEqual(
      uint8ArrayToHex(
        uint8ArrayXor(
          hexToUint8Array("1011f0a1"),
          hexToUint8Array("11010fa1")
        )
      ),
      "0110ff00"
    )
  });
});
