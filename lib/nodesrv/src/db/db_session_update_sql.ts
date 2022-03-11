export const value = `
update session
set expire_at = stime_now() + '1 hour'::interval,
  data=$(data),
  login_id=tuid6_from_compact($(loginId))
where session_id = stuid_from_compact($(sessionId));

`;
