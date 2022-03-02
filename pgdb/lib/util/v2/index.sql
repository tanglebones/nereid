-- assumes func schema exists

create or replace function func.raise_exception(what varchar)
  returns void as
$$
begin
  raise exception '%', what;
end
$$ language plpgsql;

create function func.prevent_change()
  returns trigger
  language plpgsql
as
$$
begin
  raise exception 'Records in table % cannot be %d', tg_table_name, lower(tg_op);
end;
$$;

create function func.tz_to_iso(tz timestamp with time zone) returns character varying
  language sql
as
$$
select to_char(tz, 'YYYY-MM-DD"T"HH24:mi:ssZ')
$$;
