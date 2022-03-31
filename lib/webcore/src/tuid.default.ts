import {tuidFactoryCtor} from "./tuid";
import {nowMs} from '@nereid/anycore';

export const tuidFactory = tuidFactoryCtor(window, nowMs);
