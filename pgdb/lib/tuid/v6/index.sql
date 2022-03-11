-- assumes pgcrypto loaded in func

-- version 6 of tuid
create or replace function func.tuid6()
  returns uuid as
$$
declare
  r bytea;
  ts bigint;
  ret varchar;
begin
  r := func.gen_random_bytes(10);
  ts := extract(epoch from clock_timestamp() at time zone 'utc') * 1000;

  ret := lpad(to_hex(ts), 12, '0') ||
    lpad(encode(r, 'hex'), 20, '0');

  return ret :: uuid;
end;
$$ language plpgsql;


create or replace function func.tuid6_from_tz(tz timestamptz)
  returns uuid
  language sql
as
$$
select (lpad(to_hex((extract(epoch from tz at time zone 'utc') * 1000) :: bigint), 12, '0') || '00000000000000000000')::uuid;
$$;

create or replace function func.tuid6_tz(tuid uuid)
  returns timestamptz
  language sql
as
$$
with t as (
  select tuid::varchar as x
)
select (
  'x'
    || substr(t.x, 1, 8) -- xxxxxxxx-0000-0000-0000-000000000000
    || substr(t.x, 10, 4) -- 00000000-xxxx-0000-0000-000000000000
  )::bit(64)::bigint * interval '1 millisecond' + timestamptz 'epoch'
from t;
$$;

create function func.tuid6_to_compact(tuid uuid)
  returns varchar
  language sql
as
$$
select replace(translate(encode(decode(replace(tuid::text, '-', ''), 'hex'), 'base64'), '/+', '-_'), '=', '');
$$;

create function func.tuid6_from_compact(compact varchar)
  returns uuid
  language sql
as
$$
select encode(decode(rpad(translate(compact, '-_', '/+'), 24, '='), 'base64'), 'hex')::uuid;
$$;

create function func.stuid_to_compact(stuid bytea)
  returns varchar
  language sql
as
$$
select replace(translate(encode(stuid, 'base64'), '/+', '-_'), '=', '');
$$;

create function func.stuid_from_compact(compact varchar)
  returns bytea
  language sql
as
$$
select decode(rpad(translate(compact, '-_', '/+'), 44, '='), 'base64');
$$;

create or replace function stuid()
  returns bytea
  language plpgsql
as
$$
declare
  ct bigint;
  ret bytea;
begin
  ct := extract(epoch from clock_timestamp() at time zone 'utc') * 1000;
  ret := decode(lpad(to_hex(ct), 12, '0'), 'hex') || gen_random_bytes(26);
  return ret;
end;
$$;


create function func.stuid_tz(stuid varchar)
  returns timestamptz
  language sql
as
$$
select ('x' || substr(stuid, 1, 12))::bit(64)::bigint * interval '1 millisecond' + timestamptz 'epoch';
$$;

create function func.tuid_zero()
  returns uuid
  immutable
  language sql as
'select ''00000000-0000-0000-0000-000000000000'' :: uuid';

create function func.max(uuid, uuid)
  returns uuid as
$$
begin
  if $1 is null and $2 is null
  then
    return null;
  end if;

  if $1 is null
  then
    return $2;
  end if;

  if $2 is null
  then
    return $1;
  end if;

  if $1 < $2 then
    return $2;
  end if;

  return $1;
end;
$$ language plpgsql;

create aggregate func.max (uuid)
  (
  sfunc = max,
  stype = uuid
  );

create function func.min(uuid, uuid)
  returns uuid as
$$
begin
  if $1 is null and $2 is null
  then
    return null;
  end if;

  if $1 is null
  then
    return $2;
  end if;

  if $2 is null
  then
    return $1;
  end if;

  if $1 > $2 then
    return $2;
  end if;

  return $1;
end;
$$ language plpgsql;

create aggregate func.min (uuid)
  (
  sfunc = min,
  stype = uuid
  );

