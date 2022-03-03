INSERT INTO
  session
DEFAULT VALUES
RETURNING encode(session_id, 'hex') AS session_id;
