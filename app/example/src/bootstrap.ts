import {randomFillSync} from "crypto";
import {tuidFactoryCtor} from "@nereid/nodecore";

const nowMs = () => +new Date();

export const tuidFactory = tuidFactoryCtor(
  randomFillSync,
  nowMs,
)

