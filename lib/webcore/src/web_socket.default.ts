import {webSocketFactoryCtor} from "./web_socket";
import {tuidFactory} from "./tuid.default";

export const webSocketFactory = webSocketFactoryCtor(tuidFactory, window.setTimeout, window.clearTimeout);
