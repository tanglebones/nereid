import {createHmac} from 'crypto';
import {serializableType, serialize} from "ts_agnostic";

export const sigCtor = (secret: string) => (msg: serializableType) => {
  const x = createHmac('sha256', secret);
  x.update(serialize(msg));
  return x.digest('hex');
};
