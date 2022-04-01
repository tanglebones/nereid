import {creeperEventRegistry} from "@nereid/creeper";
import {creeperServerCtor} from "./creeper_server";
import {nowMs} from "@nereid/anycore";
import {starRepositoryServerFactory} from "@nereid/nodecore";
import {webSocketHandlerType} from "@nereid/nodesrv";

export const creeperServer = creeperServerCtor(nowMs, starRepositoryServerFactory, creeperEventRegistry);
export const wsCreeperServerHandlerRegistry = {
  'creeper.commit': creeperServer.wsCommit,
  'creeper.getState': creeperServer.wsGetState,
} as Record<string, webSocketHandlerType>;
