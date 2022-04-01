import sinon from "sinon";
import {counterCtor} from "./counter";
import assert from "assert";
import React from "react";
import {actionsType} from "@nereid/webreactcore";

describe("counter", () => {
  const getSut = () => {
    const rStub: any = {
      useState: sinon.stub(),
      createElement: React.createElement,
    };
    const set: any = sinon.stub();
    rStub.useState.returns([0, set])

    const actions: actionsType = {};

    const counter = counterCtor(rStub);
    const subject = counter(actions);
    return {rStub, actions, subject, counter};
  };

  it("default", () => {
    assert(getSut().counter());
  });

  it("basics", () => {
    const {rStub, actions} = getSut();

    actions.onClick();

    rStub.useState.calledOnceWithExactly(1);
  });
});
