-- assumes pgcrypto loaded in func
-- assumes tuid/v6 used for ids
-- assumes util/v2
-- set search path before including!

-- audit.user is used to track who did the changes
-- SET "audit.user" TO 'bob@example.com';
-- RESET "audit.user";

-- Only the delta from current state is stored.
--   Inserts fully matched the current state, so entry will be an empty hstore
--   Updates will only record columns modified from current state
--   Deletes will track the entire entry as the current state becomes "nothing"
-- tx is the transaction changes occurred in so you can collate changes that occurred across multiple tables at the same time.

\echo 'history\v2'

create table
  history (
  tx bigint,
  schema_name varchar not null,
  table_name varchar not null,
  id uuid not null,
  who varchar not null,
  tz timestamptz not null default clock_timestamp(), -- NOT now() or current_timestamp, we want the clock so a transaction that updates the same data twice won't hit a conflict on insert.
  op char check (op = any (array ['I' :: char, 'U' :: char, 'D' :: char])),
  entry hstore,
  primary key (id, tz)
  -- schema_name/table_name isn't required because tuids are globally unique, tz is required as the same id can be updated multiple times in one transaction
);

create index history_tn_id_tz on history (schema_name, table_name, id, tz);

create trigger history_prevent_change
  before update or delete or truncate
  on history
execute procedure func.prevent_change();


create or replace function history_track_tg()
  returns trigger
  language plpgsql
as
$X$
declare
  who varchar;
  tx bigint;
  newhs hstore;
  oldhs hstore;
  idname varchar;
  id uuid;
begin
  select current_setting('audit.user')
  into who;

  if who is null or who = ''
  then
    raise exception 'audit.user is not set.';
  end if;

  idname = tg_argv[0];

  tx = pg_current_xact_id();

  if tg_op = 'UPDATE'
  then
    oldhs = hstore(old);
    newhs = hstore(new);
    if ((oldhs -> idname) != (newhs -> idname))
    then
      raise exception 'id cannot be changed';
    end if;

    id = (newhs -> idname) :: uuid;
    -- RAISE NOTICE '%', id;
    insert
    into
      history (id, schema_name, table_name, tx, who, op, entry)
    values (id, tg_table_schema, tg_table_name, tx, who, 'U', oldhs - newhs);
    return new;
  end if;

  if tg_op = 'INSERT'
  then
    newhs = hstore(new);
    id = (newhs -> idname) :: uuid;
    -- RAISE NOTICE '%', id;
    insert
    into
      history (id, schema_name, table_name, tx, who, op, entry)
    values (id, tg_table_schema, tg_table_name, tx, who, 'I', ''::hstore);
    return new;
  end if;

  if tg_op = 'DELETE'
  then
    oldhs = hstore(old);
    id = (oldhs -> idname) :: uuid;
    -- RAISE NOTICE '%', id;
    insert
    into
      history (id, schema_name, table_name, tx, who, op, entry)
    values (id, tg_table_schema, tg_table_name, tx, who, 'D', oldhs);
    return old;
  end if;

  return null;
end;
$X$;

do
$X$
  declare
    schema_name varchar;
  begin
    select (current_schemas(false))[1] into schema_name;
    execute format($qq$
  CREATE FUNCTION add_history_to_table(table_name VARCHAR, id_column_name VARCHAR = NULL)
    RETURNS VOID
    LANGUAGE plpgsql
  AS
  $$
  BEGIN
    IF id_column_name IS NULL
    THEN
      id_column_name = table_name || '_id';
    END IF;

    -- hook up the trigger
    EXECUTE FORMAT(
      'CREATE TRIGGER %%I
        AFTER UPDATE OR DELETE OR INSERT
        ON %I.%%I
        FOR EACH ROW EXECUTE PROCEDURE %I.history_track_tg(%%L);
      ',
      table_name || '_history',
      table_name,
      id_column_name
      );
  END;
  $$;
  $qq$, schema_name, schema_name);
  end
$X$;
