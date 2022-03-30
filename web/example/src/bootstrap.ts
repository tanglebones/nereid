import {DateTime} from "luxon";
import {tuidFactoryCtor, webSocketFactoryCtor, webSocketHandlerType} from "@nereid/webcore";
import {echo} from "./web_socket/echo";
import {starRepositoryCloneFactoryCtor} from "@nereid/anycore/dist/star_repo";
import {creeperCtor} from "./web_socket/creeper";
import {creeperEventRegistryCtor} from "@nereid/creeper";

const nowMs = () => DateTime.now().toUTC().toMillis();
export const tuidFactory = tuidFactoryCtor(window, nowMs);

const wsHostName = (subdomain: string) => {
  const hostParts = window.location.hostname.split('.').reverse();
  return `${subdomain}.${hostParts[1]}.${hostParts[0]}`;
};

const starRepositoryCloneFactory = starRepositoryCloneFactoryCtor(tuidFactory);
export const creeper = creeperCtor(starRepositoryCloneFactory,creeperEventRegistryCtor(nowMs));

const webSocketHandlerRegistry: Readonly<Record<string, webSocketHandlerType>> = {
  'echo': echo,
  'creeper.rebase': creeper.wsRebase,
  'creeper.setState': creeper.wsSetState,
};

const webSocketFactory = webSocketFactoryCtor(tuidFactory, window.setTimeout, window.clearTimeout);
export const webSocket = webSocketFactory(
  wsHostName('api'),
  webSocketHandlerRegistry,
);
