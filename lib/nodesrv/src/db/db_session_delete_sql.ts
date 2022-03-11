export const value = `
delete from session where session_id = stuid_from_compact($(sessionId));

`;
