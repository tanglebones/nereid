import assert from 'assert';
import {registryFactory} from './registry';
import {readonlyRegistryFactory} from "./readonly_registry";

describe('registryFactory', () => {
  it('Basics', () => {
    const registry = registryFactory<{ id: string, value: number }>();
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
    const us1 = registry.register('1', mk1);
    const mk2 = mk();
    const us2 = registry.register('2', mk2);

    assert.strictEqual(registry.lookup('1'), mk1);
    assert.strictEqual(registry.lookup('2'), mk2);
    assert.ok(registry.lookup('3') === undefined);

    const names = registry.names;
    assert.ok(names.length === 2);
    assert.ok(names.includes('1'));
    assert.ok(names.includes('2'));

    const values = registry.values;
    assert.ok(values.length === 2);
    assert.ok(values.includes(mk1));
    assert.ok(values.includes(mk2));

    const s12 = registry.signature;
    assert.ok(registry.signature);
    us1();
    const s2 = registry.signature;
    assert.notStrictEqual(s12, s2);
    assert.ok(registry.lookup('1') === undefined);

    const mk3 = registry.remove('2');
    assert.strictEqual(mk2, mk3);

    const us3 = registry.register('2', mk1);
    us2(); // no effect since "2" doesn't point to mk2 anymore.
    assert.strictEqual(registry.lookup('2'), mk1);

    us3(); // removes '2'/mk1
    assert.ok(registry.values.length === 0);
  });

  it('no duplicate keys', () => {
    const registry = registryFactory<string>();
    registry.register('1', 'x');
    try {
      registry.register('1', 'y');
      assert.fail('should throw');
    } catch (e:any) {
      assert.ok(e.error === 'DUPLICATE');
      assert.ok(e.name === '1');
    }
    registry.clear();
    registry.register('1', 'y');
    assert.strictEqual(registry.lookup('1'), 'y');
  });

  const sortEntries = <T>(entries: [string, T][]) => entries.sort(([a, _], [b, __]) => a < b ? -1 : a > b ? 1 : 0);

  it('conversion to readonly', () => {
    const registry = registryFactory([['a', {i: 0}], ['b', {i: 1}]]);
    registry.register('c', {i: 2});

    const readonlyRegistry = readonlyRegistryFactory(registry.entries);
    // note: data here would be shared, which is fine if registry is unused afterwards, otherwise use a clone:
    // const readonlyRegistry = readonlyRegistryFactory(cloneDeep(registry.entries));
    assert.strictEqual(registry.signature, readonlyRegistry.signature);
    assert.deepStrictEqual(sortEntries(registry.entries), sortEntries(readonlyRegistry.entries));
  });
});
