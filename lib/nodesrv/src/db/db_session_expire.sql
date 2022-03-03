delete from session where expire_at < stime_now();
