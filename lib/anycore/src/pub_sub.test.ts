import assert from 'assert';
import {pubSubCtorCtor} from './pub_sub';

// testing bootstrap
let tuidId = 0;
const tuidFactory = () => (++tuidId).toString(16).padStart(32, '0');
const pubSubCtor = pubSubCtorCtor(tuidFactory);

describe('pubSub', () => {
  it('basics', async () => {
    const psp = pubSubCtor<string>();
    const m1: string[] = [];
    const m2: string[] = [];
    psp.sub(async message => {
      m1.push(message)
    });
    const us2 = psp.sub(async message => {
      m2.push(message)
    });

    await psp.pub("1");
    await psp.pub("2");
    us2();
    await psp.pub("3");

    assert.deepStrictEqual(m1, ["1", "2", "3"]);
    assert.deepStrictEqual(m2, ["1", "2"]);
  });
});
