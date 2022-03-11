import {urlType} from "./server.type";

export const parseUrl = (rawUrl: string): urlType => {
  const m = rawUrl.match(/^\/?(?<path>([^/?]\/?)*)(\?(?<params>.*$))?/);
  // istanbul ignore next
  // -- unreachable branch, but necessary for type safety
  if (!m || !m.groups) {
    // istanbul ignore next
    // -- unreachable branch, but necessary for type safety
    return {path: '/', params: []};
  }

  const path = '/' + m.groups.path;
  let params: [string, string][] = [];
  if (m.groups.params) {
    params = m.groups.params.split('&').map(p => {
      const x = p.split('=');
      return [decodeURIComponent(x[0]), decodeURIComponent(x[1] || '')];
    });
  }
  return {path, params};
};
