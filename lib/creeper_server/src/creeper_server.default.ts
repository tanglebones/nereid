import {creeperEventRegistry} from "@nereid/creeper";
import {creeperServerCtorCtor} from "./creeper_server";
import {nowMs} from "@nereid/anycore";
import {starRepositoryServerFactory} from "@nereid/nodecore";

export const creeperServerCtor = creeperServerCtorCtor(nowMs, starRepositoryServerFactory, creeperEventRegistry);
