export const value = `
select login_id, app_data, system_data, login.login, login.display_name
from
  session
    left join login using (login_id)
where session_id = decode($(sessionId), 'hex')
  and expire_at > stime_now();

`;
