import {bufferXor} from "./buffer_xor";
import assert from "assert";


describe("buffer_xor", () => {
  it("basics", () => {
    const a = Buffer.from("ffff0000ffff", "hex");
    const b = Buffer.from("00ff00ff00ff", "hex");
    const x = bufferXor(a, b);
    assert.strictEqual(x.toString("hex"), "ff0000ffff00");
  });
  it("invalid", () => {
    const a = Buffer.from("ffff0000ffff", "hex");
    const b = Buffer.from("00ff00ff00", "hex");
    const u = undefined as unknown as Buffer;
    const n = null as unknown as Buffer;

    for (const [o, p] of [[a, b], [b, a], [u, b], [a, u], [n, b], [a, n], [u, u], [n, n]]) {
      assert.throws(() => {
        bufferXor(o, p);
      });
    }
  });
});
