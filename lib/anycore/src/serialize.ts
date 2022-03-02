// wrapper around: json-stable-stringify
import stringify from 'json-stable-stringify';
import {RecursivePartial} from "./recursive_partial.type";

// only support simple nested data
export type serializablePrimitiveType = string | number | boolean | null | undefined;
export type serializableType =
  { [key: string]: serializableType | serializableType[] | serializablePrimitiveType | serializablePrimitiveType[] }
  | serializablePrimitiveType
  | serializablePrimitiveType[];

// pure functions do not need a Ctor

/**
 *
 * @param what data to serialize to JSON
 */
export const serialize = (what: serializableType) => {
  // Since stringify is pure we don't inject it.
  // We've limited the input space by using the TS type system to only accept data that won't throw an Error here.
  return stringify(what);
};

/**
 * We return a `RecursivePartial<T>` because there is no guarantee the data in the string matches the type T's
 * requirements.
 *
 * @param serialized JSON to deserialize into a RecursivePartial<T>
 */
export const deserialize = <T extends serializableType>(serialized: string) => {
  // JSON.parse is build-in and pure, so we don't inject it.
  // Technically we _should_ abstract the Errors it might thrown, but since this is built into the language
  // we can rely on them being stable. If this was a third party library we would consider it.
  return JSON.parse(serialized) as RecursivePartial<T>;
};
