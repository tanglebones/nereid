export const value = `
SELECT login
     , client_profile_id
     , federated_login_id
     , data
FROM
  "session"
WHERE session_id = DECODE($(sessionId), 'hex')
  AND expire_at > NOW()

`;
