export const parseCookie = (cookie: string | undefined): [string, string][] => {
  if (!cookie) {
    return [];
  }
  return cookie.split('; ').map(p => {
    const x = p.split('=');
    return [decodeURIComponent(x[0]), decodeURIComponent(x[1] || '')];
  });
};
