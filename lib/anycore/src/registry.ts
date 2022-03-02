import {h64} from 'xxhashjs';
import {readonlyRegistryType} from "./readonly_registry";

export type registryType<T> = readonlyRegistryType<T> & {
  register(name: string, item: T): () => void; // register a new item, returns unregister function
  clear(): void;
  remove(name: string): T | undefined;
};

/**
 * Maps string to T
 * Allows changes to the mapping
 * Signature on the keys (in sorted order), cached, invalidated on mapping changes
 * @param items
 */
export const registryFactory = <T>(items: [string, T][] | undefined = undefined) => {
  let registry: { [name: string]: T } = {};
  let signature = '';
  let signatureValid = false;

  if (items) {
    items.forEach(i => {
      registry[i[0]] = i[1];
    });
  }

  const register = (name: string, item: T) => {
    if (registry[name]) {
      throw {exception: new Error(), error: 'DUPLICATE', name};
    }
    registry[name] = item;
    signatureValid = false;
    return () => {
      if (registry[name] === item) {
        delete registry[name];
      }
      signatureValid = false;
    };
  }

  const lookup = (name: string) => registry[name];

  const clear = () => {
    registry = {};
  };

  const computeSignature = () => {
    if (!signatureValid) {
      const keys = Object.keys(registry).sort();
      const h = h64();
      for (const key of keys) {
        h.update(key);
      }
      signatureValid = true;
      signature = h.digest().toString(16).padStart(16, '0');
    }
    return signature;
  };

  const remove = (name: string) => {
    const t = registry[name];
    delete registry[name];
    return t;
  };

  const r: registryType<T> = {
    register,
    lookup,
    clear,
    remove,
    get values(): T[] {
      return Object.values(registry);
    },
    get names(): string[] {
      return Object.keys(registry);
    },
    get signature(): string {
      return computeSignature();
    },
    get entries(): [string, T][] {
      return Object.entries(registry);
    }
  };

  return r;
}