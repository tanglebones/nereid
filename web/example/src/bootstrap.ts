import {DateTime} from "luxon";
import {tuidFactoryCtor, webSocketCtor} from "@nereid/webcore";
import {echo} from "./web_socket/echo";
import {starRepositoryCloneFactoryCtor} from "@nereid/anycore/dist/star_repo";
import {creeperCtor} from "./web_socket/creeper";

const nowMs = () => DateTime.now().toUTC().toMillis();
const tuidFactory = tuidFactoryCtor(window, nowMs);

const wsHostName = (subdomain: string) => {
  const hostParts = window.location.hostname.split('.').reverse();
  return `${subdomain}.${hostParts[1]}.${hostParts[0]}`;
};

const starRepositoryCloneFactory = starRepositoryCloneFactoryCtor(tuidFactory);
export const creeper = creeperCtor(starRepositoryCloneFactory);

const webSocketHandlerRegistry = {
  'echo': echo,
  'creeper.commit': creeper.commit,
};

export const webSocket = webSocketCtor(tuidFactory, window.setTimeout, window.clearTimeout)(
  wsHostName('api'),
  webSocketHandlerRegistry,
);
