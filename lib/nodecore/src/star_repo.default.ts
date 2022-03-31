import {starRepositoryCloneFactoryCtor, starRepositoryServerFactoryCtor} from "@nereid/anycore";
import {tuidFactory} from "./tuid.default";

export const starRepositoryServerFactory = starRepositoryServerFactoryCtor(tuidFactory);
export const starRepositoryCloneFactory = starRepositoryCloneFactoryCtor(tuidFactory);
