import assert from "assert";
import {base64ToBase64Url, base64UrlToBase64} from "./base64_url";

describe("base64Url", () => {
  it("works", () => {
    assert.strictEqual(base64ToBase64Url("AA/+/+="),"AA_-_-");
    assert.strictEqual(base64UrlToBase64("AA_-_-"),"AA/+/+");
  });
});
