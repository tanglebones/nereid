export const base64UrlToBase64 = (v: string) => v.replaceAll('_', '/').replaceAll('-', '+');
export const base64ToBase64Url = (v: string) => v.replaceAll('/', '_').replaceAll('+', '-').replaceAll('=', '');
