import {creeperEventRegistry} from "@nereid/creeper";
import {creeperClientCtor} from "./creeper_client";
import {starRepositoryCloneFactory, webSocketHandlerType} from "@nereid/webcore";

export const creeperClient = creeperClientCtor(starRepositoryCloneFactory, creeperEventRegistry);
export const wsCreeperClientHandlerRegistry: Readonly<Record<string, webSocketHandlerType>> = {
  'creeper.rebase': creeperClient.wsRebase,
  'creeper.setState': creeperClient.wsSetState,
};
