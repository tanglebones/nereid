import {creeperEventRegistryCtor} from "./creeper";
import {nowMs} from "@nereid/anycore";

export const creeperEventRegistry = creeperEventRegistryCtor(nowMs);
