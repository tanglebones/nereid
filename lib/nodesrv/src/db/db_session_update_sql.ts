export const value = `
update session
set expire_at = current_timestamp + '1 hour'::interval,
  app_data=$(app_data),
  system_data=$(system_data),
  login_id=$(login_id)
where session_id = decode($(sessionId), 'hex');

`;
