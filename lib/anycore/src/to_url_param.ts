export const toUrlParam = (paramArray: [string, { toString: () => string }][]): string => paramArray.map(
  (e) => `${encodeURIComponent(e[0])}=${encodeURIComponent(`${e[1]}`)}`,
).join('&');
