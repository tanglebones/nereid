import {tuidFactoryCtor} from "./tuid";
import {nowMs} from "@nereid/anycore";
import {randomFillSync} from "crypto";

export const tuidFactory = tuidFactoryCtor(randomFillSync, nowMs);
