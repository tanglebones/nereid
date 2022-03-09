export const kvpArrayToObject = (p: [string,unknown][]) => {
  const r: Record<string, unknown> = {};
  for (const e of p) {
    r[e[0]] = e[1];
  }
  return r;
};
