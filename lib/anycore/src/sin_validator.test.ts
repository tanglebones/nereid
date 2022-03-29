import assert from "assert";
import {sinValidator} from "./sin_validator";

describe("sinValidator", ()=>{
  it("works", ()=>{
    assert(!sinValidator(undefined));
    assert(!sinValidator(''));
    assert(!sinValidator("123456789"));
    assert(!sinValidator("00000000"));
    assert(!sinValidator("046b454b286"));
    assert(sinValidator("046 454 286"));
    assert(sinValidator("000-000-000"));
    assert(sinValidator("000 000 000"));
    assert(sinValidator("000000000"));
    assert(sinValidator("111111118"));
    assert(sinValidator("222222226"));
    assert(sinValidator("333333334"));
    assert(sinValidator("444444442"));
    assert(sinValidator("555555556"));
    assert(sinValidator("666666664"));
    assert(sinValidator("777777772"));
    assert(sinValidator("888888880"));
    assert(sinValidator("999999998"));

  });
});
