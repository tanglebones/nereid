import {serverFactoryCtor} from "@nereid/nodesrv";
import {createServer} from "http";
import {clearInterval} from "timers";
import {cancellationTokenFactoryCtor} from "@nereid/anycore";
import {dbProviderCtor} from "@nereid/nodesrv/dist/db/db_provider";
import {exitCtor} from "@nereid/nodesrv/dist/exit";
import {eventLoopHealthMonitorCtor, tuidFactoryCtor} from "@nereid/nodecore";
import {randomFillSync} from "crypto";

const nowMs = () => +new Date();
const tuidFactory = tuidFactoryCtor(randomFillSync, nowMs, "base64url");

const cancellationTokenFactory = cancellationTokenFactoryCtor();

eventLoopHealthMonitorCtor(
  nowMs,
  setInterval,
  clearInterval,
  console.error,
  +(process.env.NODE_EVENT_LOOP_HEALTH_MONITOR_INTERVAL || '10000'),
  +(process.env.NODE_EVENT_LOOP_HEALTH_MONITOR_MAX_DRIFT || '100'),
);

const appConnectionString = process.env.PGDB_URL_APP;
if (!appConnectionString) {
  throw new Error("PGDB_URL_APP not set");
}

const staffConnectionString = process.env.PGDB_URL_APP;
if (!staffConnectionString) {
  throw new Error("PGDB_URL_APP not set");
}
export const exit = exitCtor(process, cancellationTokenFactory);
export const appDbProvider = dbProviderCtor({connectionString: appConnectionString, application_name: 'ep_app'});
// export const staffDbProvider = dbProviderCtor({connectionString: staffConnectionString, application_name: 'ep_staff'});
export const serverFactory = serverFactoryCtor(createServer, setInterval, tuidFactory);

