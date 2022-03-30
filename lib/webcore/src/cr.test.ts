import {crClientResponse, crClientInit} from "./cr";
import assert from "assert";

describe("cr", () => {
  it("basics", () => {
    const r = "0005bba40debad081abe1faf9d3685b50d7af9990afe17da81d2affa6c7a8f25|306d165550ef10e7d58c0dbd68f7333c25dc094345d0b58e1c6eb673ebcb680c"
    const nb64 = "0AIknPMK3vwDj1GXQbWjxlvL5AkCC-bP7xOC9ePjBGE"
    const salt = "$2a$10$mnymedWwVuipoNpzlfYPs."
    const password = 'asdfasdf';
    const {hpnb64}= crClientInit(password,nb64);
    const hpnb64Expected = "-j03b-YZCgZAnKMXQA32iNAxaUPzFjnBTGTKuxhEebnOQ4s4kIG9pNxTftNBW534n-a3O3WAO2VXVxqUAHcUMg"
    assert.strictEqual(hpnb64, hpnb64Expected);
    const {fb64}=crClientResponse(r,nb64,salt,password);
    const fb64Expected = "hMXJUBYERTverlr01LIz9Kq8ky9V3zIDT2oou3CfMn19CZz9Zx4FNs6uO7_BXHRMT6L0nzgdRIMo3a3eW5x-RQ";
    assert.strictEqual(fb64,fb64Expected);
  });
});
