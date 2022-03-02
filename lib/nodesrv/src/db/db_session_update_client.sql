UPDATE "session"
SET
  expire_at = current_timestamp + '1 hour'::INTERVAL,
  data=$(data),
  login=$(login),
  client_profile_id=$(clientProfileId),
  federated_login_id=$(federatedLoginId)
WHERE session_id = decode($(sessionId), 'hex');
