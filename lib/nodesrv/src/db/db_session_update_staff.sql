UPDATE "session"
SET
  expire_at = current_timestamp + '1 hour'::INTERVAL,
  data=$(data),
  login=$(login)
WHERE session_id = decode($(sessionId), 'hex');
