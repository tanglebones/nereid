import {h64} from 'xxhashjs';

export type readonlyRegistryType<T> = {
  signature: string; // hash of the names and items (via toString)
  lookup(name: string): T | undefined; // lookup an item by name
  values: T[]; // all items (no implied order)
  names: string[]; // all names (no implied order)
  entries: [string, T][]; // all entries (no implied order)
};
/**
 * Maps string to T
 * Prevents accidental changes to the mapping
 * Signature on the keys (in sorted order)
 * @param items
 */
export const readonlyRegistryFactory = <T>(items: [string, T][]) => {
  const registry: { [name: string]: T } = {};
  let signature = '';

  const lookup = (name: string): T => registry[name];

  {
    items.forEach(i => {
      registry[i[0]] = i[1];
    });

    const keys = Object.keys(registry).sort();
    const h = h64();
    for (const key of keys) {
      h.update(key);
    }

    signature = h.digest().toString(16).padStart(16, '0');
  }

  const r: readonlyRegistryType<T> = {
    lookup,
    get values(): T[] {
      return Object.values(registry);
    },
    get names(): string[] {
      return Object.keys(registry);
    },
    get signature(): string {
      return signature;
    },
    get entries(): [string, T][] {
      return Object.entries(registry);
    }
  };

  return r;
}