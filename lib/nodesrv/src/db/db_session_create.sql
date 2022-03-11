insert into session
  default
values
returning stuid_to_compact(session_id) as session_id;
