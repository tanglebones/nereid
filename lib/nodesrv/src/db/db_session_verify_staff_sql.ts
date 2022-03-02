export const value = `
SELECT login
     , data
FROM
  "session"
WHERE session_id = DECODE($(sessionId), 'hex')
  AND expire_at > NOW()

`;
