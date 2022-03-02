export const value = `
DELETE FROM "session" WHERE session_id=decode($(sessionId),'hex');

`;
