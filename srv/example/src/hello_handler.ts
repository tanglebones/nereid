import {ctxType} from "@nereid/nodesrv/dist/server.type";

export const helloHandler = (ctx: ctxType) => {
  if (!ctx.url.path.startsWith('/hello')) {
    return
  }
  ctx.res.writeHead(200, "OK", {"Content-Type": "text/plain; charset=utf-8"});
  ctx.res.end("Hello");
};
