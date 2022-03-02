import assert from "assert";
import {authz} from "./index";

const objSet = (...entries: string[]) => {
  const r: Record<string, boolean> = {};
  entries.forEach((e) => r[e] = true);
  return r;
};

const mctx = (permission: { [name: string]: boolean }, login?: string) => {
  if (login) {
    return {
      permission,
      user: {
        login
      },
    };
  }
  return {
    permission
  }
};

describe("authzType", () => {
  it("authz.anyOf", () => {
    const ctx = mctx(objSet("A", "B"));
    assert(!authz.anyOf([])({}));
    assert(!authz.anyOf([])(ctx));
    assert(!authz.anyOf(["C"])(ctx));
    assert(authz.anyOf(["A"])(ctx));
    assert(authz.anyOf(["B"])(ctx));
    assert(authz.anyOf(["B", "C"])(ctx));
    assert(authz.anyOf(["A", "C"])(ctx));
    assert(authz.anyOf(["B", "A"])(ctx));
  });

  it("authz.allOf", () => {
    const ctx = mctx(objSet("A", "B"));
    assert(!authz.allOf([])({}));
    assert(!authz.allOf([])(ctx));
    assert(!authz.allOf(["C"])(ctx));
    assert(authz.allOf(["A"])(ctx));
    assert(authz.allOf(["B"])(ctx));
    assert(!authz.allOf(["B", "C"])(ctx));
    assert(!authz.allOf(["A", "C"])(ctx));
    assert(authz.allOf(["B", "A"])(ctx));
  });

  it("authz.anyUser", () => {
    assert(!authz.anyUser(mctx({})));
    assert(!authz.anyUser(mctx({}, "")));
    assert(authz.anyUser(mctx({}, "x")));

  });

  it("authz.anon", () => {
    assert(authz.anon(mctx({})));
  });

  it("authz.anyOfAuthz", () => {
    const authzABxC = authz.anyOfAuthz([authz.allOf(["A", "B"]), authz.anyOf(["C"])]);
    assert(!authzABxC(mctx(objSet("A"))));
    assert(!authzABxC(mctx(objSet("B"))));
    assert(authzABxC(mctx(objSet("C"))));
    assert(authzABxC(mctx(objSet("A", "B"))));
  });

  it("authz.allOfAuthz", () => {
    const authzABBC = authz.allOfAuthz([authz.allOf(["A", "B"]), authz.allOf(["B", "C"])]);
    assert(!authzABBC(mctx(objSet("A"))));
    assert(!authzABBC(mctx(objSet("B"))));
    assert(!authzABBC(mctx(objSet("C"))));
    assert(!authzABBC(mctx(objSet("A", "B"))));
    assert(!authzABBC(mctx(objSet("A", "B"))));
    assert(authzABBC(mctx(objSet("A", "B", "C"))));
  });
});
