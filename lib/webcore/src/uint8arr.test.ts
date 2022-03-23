import assert from "assert";
import {uint8ArrayToBase64Url} from "./uint8arr";

describe('uint8ArrayToBase64Url', () => {
  it("basics", () => {
    assert.strictEqual("AAAAAAAA", uint8ArrayToBase64Url(new Uint8Array([0, 0, 0, 0, 0, 0])));
    const uint8Array = new Uint8Array([0, 0, 1, 250, 134, 255]);
    assert.strictEqual("AAAB-ob_", uint8ArrayToBase64Url(uint8Array));
    assert.strictEqual(Buffer.from("000001fa86ff", "hex").toString("base64url"), uint8ArrayToBase64Url(uint8Array));
  });
});
