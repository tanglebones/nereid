import {crClientResponse, crClientInit} from "./cr";

describe("cr", () => {
  it("basics", () => {
    console.log(crClientInit("test",""));
    crClientResponse("","","","test");
  });
});
