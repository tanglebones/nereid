import {rateLimitCtor, rateLimitEmitLastCtor} from '@nereid/anycore';

export const rateLimit = rateLimitCtor(() => +Date.now(), window.setTimeout);
export const rateLimitEmitLast = rateLimitEmitLastCtor(() => +Date.now(), window.setTimeout);
