import assert from 'assert';
import sinon from 'sinon';
import {
  tuidBase64urlToHex,
  tuidEpochMilli,
  tuidFactoryCtor,
  tuidForTestingFactoryCtor,
  tuidHexToBase64url
} from './tuid';

describe("tuid", () => {
  const getSut = () => {
    const randomFillSyncStub = sinon.stub();
    const nowMsStub = sinon.stub();
    const tuidFactory = tuidFactoryCtor(randomFillSyncStub, nowMsStub);
    return {tuidFactory, randomFillSyncStub, nowMsStub};
  };

  it("works w/ default formatter", () => {
    const {tuidFactory, randomFillSyncStub, nowMsStub} = getSut();

    nowMsStub.returns(0x7770_7771_7772_777en);
    assert.strictEqual("d3F3cnd-AAAAAAAAAAAAAA", tuidFactory());
    assert.strictEqual("d3F3cnd_AAAAAAAAAAAAAA", tuidFactory());

    randomFillSyncStub.callsFake((buffer: Buffer, start: number, count: number) => {
      const end = start + count;
      for (let i = start; i < end; ++i) {
        buffer[i] = 0xff;
      }
    });
    assert.strictEqual("d3F3cneA_____________w", tuidFactory());
  });

  it("works w/ b64u formatter", () => {
    const {tuidFactory, randomFillSyncStub, nowMsStub} = getSut();

    nowMsStub.returns(0x7770_7771_7772_777en);
    assert.strictEqual("d3F3cnd-AAAAAAAAAAAAAA", tuidFactory());
    assert.strictEqual("d3F3cnd_AAAAAAAAAAAAAA", tuidFactory());

    randomFillSyncStub.callsFake((buffer: Buffer, start: number, count: number) => {
      const end = start + count;
      for (let i = start; i < end; ++i) {
        buffer[i] = 0xff;
      }
    });
    assert.strictEqual("d3F3cneA_____________w", tuidFactory());
  });

  it("hexToBase64url", () => {
    assert.strictEqual("d3F3cnd-AAAAAAAAAAAAAA", tuidHexToBase64url("77717772777e00000000000000000000"));
    assert.strictEqual("d3F3cnd_AAAAAAAAAAAAAA", tuidHexToBase64url("77717772777f00000000000000000000"));
    assert.strictEqual("d3F3cneA_____________w", tuidHexToBase64url("777177727780ffffffffffffffffffff"));
  });

  it("base64urlToHex", () => {
    assert.strictEqual("77717772777e00000000000000000000", tuidBase64urlToHex("d3F3cnd-AAAAAAAAAAAAAA"));
    assert.strictEqual("77717772777f00000000000000000000", tuidBase64urlToHex("d3F3cnd_AAAAAAAAAAAAAA"));
    assert.strictEqual("777177727780ffffffffffffffffffff", tuidBase64urlToHex("d3F3cneA_____________w"));
  });

  it("tuidEpochMicro", () => {
    {
      const tuidFactory = tuidForTestingFactoryCtor();
      assert.strictEqual(0, tuidEpochMilli(tuidFactory()));
      assert.strictEqual(1, tuidEpochMilli(tuidFactory()));
    }
    {
      const tuidFactory = tuidForTestingFactoryCtor(11);
      assert.strictEqual(11, tuidEpochMilli(tuidFactory()));
    }
  });
});
