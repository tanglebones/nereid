import {pubSubCtorCtor} from "@nereid/anycore";
import {tuidFactory} from "./tuid.default";

export const pubSubCtor = pubSubCtorCtor(tuidFactory);
