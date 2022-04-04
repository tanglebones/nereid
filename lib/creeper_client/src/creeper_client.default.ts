import {creeperEventRegistry} from "@nereid/creeper";
import {creeperClientCtorCtor} from "./creeper_client";
import {starRepositoryCloneFactory} from "@nereid/webcore";

export const creeperClientCtor = creeperClientCtorCtor(starRepositoryCloneFactory, creeperEventRegistry);
