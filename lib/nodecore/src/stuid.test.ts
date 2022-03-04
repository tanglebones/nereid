import assert from 'assert';
import sinon from 'sinon';
import {
  stuidBase64urlToHex,
  stuidEpochMicro,
  stuidFactoryCtor,
  stuidForTestingFactoryCtor,
  stuidHexToBase64url
} from './stuid';

describe("stuid", () => {
  const getSut = (format: "hex" | "base64url" | undefined = undefined) => {
    const randomFillSyncStub = sinon.stub();
    const nowMsStub = sinon.stub();
    const stuidFactory = stuidFactoryCtor(randomFillSyncStub, nowMsStub, format);
    return {stuidFactory, randomFillSyncStub, nowMsStub};
  };

  it("works w/ default formatter", () => {
    const {stuidFactory, randomFillSyncStub, nowMsStub} = getSut();

    nowMsStub.returns(0x7770_7771_7772_777en);
    assert.strictEqual("77717772777e0000000000000000000000000000000000000000000000000000", stuidFactory());
    assert.strictEqual("77717772777f0000000000000000000000000000000000000000000000000000", stuidFactory());

    randomFillSyncStub.callsFake((buffer: Buffer, start: number, count: number) => {
      const end = start + count;
      for (let i = start; i < end; ++i) {
        buffer[i] = 0xff;
      }
    });
    assert.strictEqual("777177727780ffffffffffffffffffffffffffffffffffffffffffffffffffff", stuidFactory());
  });

  it("works w/ b64u formatter", () => {
    const {stuidFactory, randomFillSyncStub, nowMsStub} = getSut("base64url" as const);

    nowMsStub.returns(0x7770_7771_7772_777en);
    assert.strictEqual("d3F3cnd-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", stuidFactory());
    assert.strictEqual("d3F3cnd_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", stuidFactory());

    randomFillSyncStub.callsFake((buffer: Buffer, start: number, count: number) => {
      const end = start + count;
      for (let i = start; i < end; ++i) {
        buffer[i] = 0xff;
      }
    });
    assert.strictEqual("d3F3cneA__________________________________8", stuidFactory());
  });

  it("hexToBase64url", () => {
    assert.strictEqual("d3F3cnd-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", stuidHexToBase64url("77717772777e0000000000000000000000000000000000000000000000000000"));
    assert.strictEqual("d3F3cnd_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", stuidHexToBase64url("77717772777f0000000000000000000000000000000000000000000000000000"));
    assert.strictEqual("d3F3cneA__________________________________8", stuidHexToBase64url("777177727780ffffffffffffffffffffffffffffffffffffffffffffffffffff"));
  });

  it("base64urlToHex", () => {
    assert.strictEqual("77717772777e0000000000000000000000000000000000000000000000000000", stuidBase64urlToHex("d3F3cnd-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"));
    assert.strictEqual("77717772777f0000000000000000000000000000000000000000000000000000", stuidBase64urlToHex("d3F3cnd_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"));
    assert.strictEqual("777177727780ffffffffffffffffffffffffffffffffffffffffffffffffffff", stuidBase64urlToHex("d3F3cneA__________________________________8"));
  });

  it("stuidEpochMicro", () => {
    {
      const stuidFactory = stuidForTestingFactoryCtor();
      assert.strictEqual(0, stuidEpochMicro(stuidFactory()));
      assert.strictEqual(1, stuidEpochMicro(stuidFactory()));
    }
    {
      const stuidFactory = stuidForTestingFactoryCtor(11);
      assert.strictEqual(11, stuidEpochMicro(stuidFactory()));
    }
  });
});
