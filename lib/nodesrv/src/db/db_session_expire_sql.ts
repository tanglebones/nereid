export const value = `
delete from session where expire_at < current_timestamp;

`;
