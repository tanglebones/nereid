import assert from 'assert';
import {readonlyRegistryFactory} from "./readonly_registry";

describe('readonlyRegistryFactory', () => {
  it('Basics', () => {
    let id = 0;
    let value = 100;
    const mk = () => ({
      id: `x${id++}`,
      value: value++,
      toString() {
        return `${this.id} ${this.value}`;
      },
    });

    const mk1 = mk();
    const mk2 = mk();

    const readonlyRegistry = readonlyRegistryFactory<{ id: string, value: number }>([['1', mk1], ['2', mk2]]);

    assert.strictEqual(readonlyRegistry.lookup('1'), mk1);
    assert.strictEqual(readonlyRegistry.lookup('2'), mk2);
    assert.ok(readonlyRegistry.lookup('3') === undefined);

    const values = readonlyRegistry.values;
    assert.ok(values.length === 2);
    assert.ok(values.includes(mk1));
    assert.ok(values.includes(mk2));

    const names = readonlyRegistry.names;
    assert.ok(names.length === 2);
    assert.ok(names.includes('1'));
    assert.ok(names.includes('2'));

    assert.strictEqual(readonlyRegistry.signature, '5460f49adbe7aba2');
  });
});
