create function stime_now()
  returns timestamptz
  language plpgsql
as
$$
declare
  stime_now_text_ text;
  stime_now_inc_text_ text;
  stime_now_ timestamptz;
begin
  select current_setting('stime.now', true) into stime_now_text_;
  if stime_now_text_ is not null and stime_now_text_ != '' then
    stime_now_ = stime_now_text_ :: timestamptz;
    select current_setting('stime.now_inc', true) into stime_now_inc_text_;
    if stime_now_inc_text_ is not null and stime_now_inc_text_ != '' then
      perform set_config('stime.now', (stime_now_ + stime_now_inc_text_ :: interval) :: timestamptz :: text, false);
    end if;
    return stime_now_;
  end if;
  return now();
end;
$$;

create function stime_today()
  returns date
  language plpgsql
as
$$
declare
  stime_today_text_ text;
  stime_today_inc_text_ text;
  stime_today_ date;
begin
  select current_setting('stime.today', true) into stime_today_text_;
  if stime_today_text_ is not null and stime_today_text_ != '' then
    stime_today_ = stime_today_text_ :: date;
    select current_setting('stime.today_inc', true) into stime_today_inc_text_;
    if stime_today_inc_text_ is not null and stime_today_inc_text_ != '' then
      perform set_config('stime.today', (stime_today_ + stime_today_inc_text_ :: interval) :: date :: text, false);
    end if;
    return stime_today_;
  end if;
  return current_date;
end;
$$;

create function stime_clock()
  returns timestamptz
  language plpgsql
as
$$
declare
  stime_clock_text_ text;
  stime_clock_inc_text_ text;
  stime_clock_ timestamptz;
begin
  select current_setting('stime.clock', true) into stime_clock_text_;
  if stime_clock_text_ is not null and stime_clock_text_ != '' then
    stime_clock_ = stime_clock_text_ :: timestamptz;
    select current_setting('stime.clock_inc', true) into stime_clock_inc_text_;
    if stime_clock_inc_text_ is not null and stime_clock_inc_text_ != '' then
      perform set_config('stime.clock', (stime_clock_ + stime_clock_inc_text_ :: interval) :: timestamptz :: text,
                         false);
    end if;
    return stime_clock_;
  end if;
  return clock_timestamp();
end;
$$;

-- reset "stime.now";
-- select stime_now();
-- set session "stime.now" = '2020-01-01T00:00:00Z';
-- select stime_now(), stime_now();
-- set session "stime.now_inc" = '1 second';
-- select stime_now(), stime_now();
-- reset "stime.now";
--
-- reset "stime.clock";
-- select stime_clock();
-- set session "stime.clock" = '2020-01-01T00:00:00Z';
-- select stime_clock(), stime_clock();
-- set session "stime.clock_inc" = '1 second';
-- select stime_clock(), stime_clock();
-- reset "stime.clock";
--
-- reset "stime.today";
-- select stime_today();
-- set session "stime.today" = '2020-01-01';
-- select stime_today(), stime_today();
-- set session "stime.today_inc" = '1 day';
-- select stime_today(), stime_today();
-- reset "stime.today";
