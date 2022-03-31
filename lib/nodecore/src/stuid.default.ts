import {stuidFactoryCtor} from "./stuid";
import {randomFillSync} from "crypto";
import {nowMs} from "@nereid/anycore";

export const stuidFactory = stuidFactoryCtor(randomFillSync, nowMs);
