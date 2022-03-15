export const value = `
select tuid6_to_compact(login_id) as login_id, data, login.login, login.display_name
from
  session
    left join login using (login_id)
where session_id = stuid_from_compact($(sessionId))
  and expire_at > stime_now();

`;
