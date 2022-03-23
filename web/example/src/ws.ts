import {tuidFactoryCtor, wsCtor} from "@nereid/webcore";
import {serializableType} from "@nereid/anycore";
import {DateTime} from "luxon";

type windowType = typeof window;
const wsHostNameCtor = (window: windowType) => (subdomain: string) => {
  const hostParts = window.location.hostname.split('.').reverse();
  return `${subdomain}.${hostParts[1]}.${hostParts[0]}`;
};

const echo = async (params: serializableType) => {
  return {from: 'client', params};
}

const wsHandlerRegistry = {
  echo,
};

const tuidFactory = tuidFactoryCtor(window, () => DateTime.now().toUTC().toMillis())

export const ws = wsCtor(tuidFactory, window.setTimeout, window.clearTimeout)(
  wsHostNameCtor(window)('api'),
  wsHandlerRegistry,
);
