import {serializableType} from "@nereid/anycore";

export const echo = async (params: serializableType) => {
  return {from: 'client', params};
}
