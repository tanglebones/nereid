-- assumes func schema exists

create or replace function func.create_upsert_using_primary_key(schema_n varchar, table_n varchar) returns void
  language plpgsql
as
$$
declare
  columns varchar[];
  primary_key_columns varchar[];
  distinct_columns varchar[]; -- columns - pk_columns - ui_columns
  primary_key_columns_literal varchar;
  upsert_sql varchar;
  params_literal varchar;
  params_decl_literal varchar;
  upsert_columns_literal varchar;
  do_sql varchar;
  distinct_columns_set_literal varchar;
  distinct_table_columns_literal varchar;
  distinct_excluded_columns_literal varchar;
  distinct_columns_is_distinct_from_literal varchar;
begin
  select array_agg(column_name :: varchar)
  into columns
  from
    information_schema.columns c
  where c.table_schema = schema_n
    and c.table_name = table_n;

  select array_agg(a.attname)
  into primary_key_columns
  from
    pg_index x
      join pg_class c
           on c.oid = x.indrelid
      join pg_class i
           on i.oid = x.indexrelid
      left join pg_attribute a
                on a.attrelid = c.oid and a.attnum = any (x.indkey)
      left join pg_namespace n
                on n.oid = c.relnamespace
  where ((c.relkind = any (array ['r'::char, 'm'::char])) and (i.relkind = 'i'::char))
    and x.indisprimary
    and n.nspname = schema_n
    and c.relname = table_n;

  select array_agg(v)
  into distinct_columns
  from
    unnest(columns) a(v)
  where v != all (primary_key_columns);

  select array_to_string(array_agg(format(
    '%I %s',
    v || '_',
    trim(leading '_' from c.udt_name) || case c.data_type when 'ARRAY' then '[]' else '' end
    )), ', ')
  into params_decl_literal
  from
    unnest(columns) a(v)
      join information_schema.columns c
           on c.table_name = table_n and c.table_schema = schema_n and c.column_name = v;

  select array_to_string(array_agg(format('%I', v || '_')), ', ')
  into params_literal
  from
    unnest(columns) a(v);

  select array_to_string(array_agg(format('%I', v)), ', ')
  into upsert_columns_literal
  from
    unnest(columns) a(v);

  select array_to_string(array_agg(format('%I', v)), ', ')
  into primary_key_columns_literal
  from
    unnest(primary_key_columns) a(v);

  do_sql = 'DO NOTHING';

  if cardinality(distinct_columns) > 0 then
    select array_to_string(array_agg(format('%I = %I', v, v || '_')), ', ')
    into distinct_columns_set_literal
    from
      unnest(distinct_columns) a(v);

    select array_to_string(array_agg(format('%I.%I', table_n, v)), ', ')
    into distinct_table_columns_literal
    from
      unnest(distinct_columns) a(v);

    select array_to_string(array_agg(format('excluded.%I', v)), ', ')
    into distinct_excluded_columns_literal
    from
      unnest(distinct_columns) a(v);

    distinct_columns_is_distinct_from_literal = format(
      '       (%s)
          IS DISTINCT FROM
              (%s)',
      distinct_table_columns_literal,
      distinct_excluded_columns_literal
      );

    do_sql = format(
      '   DO UPDATE SET
              %s
          WHERE
              %s',
      distinct_columns_set_literal,
      distinct_columns_is_distinct_from_literal
      );
  end if;

  upsert_sql = format(
    $Q$
                CREATE OR REPLACE FUNCTION %I.%I(%s) RETURNS VOID LANGUAGE SQL AS %s%s
                    INSERT INTO %I.%I (%s) VALUES (%s)
                    ON CONFLICT (%s)
                    %s;
                ;%s%s
            $Q$,
    schema_n, table_n || '_upsert', params_decl_literal, '$', '$',
    schema_n, table_n, upsert_columns_literal, params_literal,
    primary_key_columns_literal,
    do_sql,
    '$', '$'
    );
  -- RAISE NOTICE '%', upsert_sql;
  execute upsert_sql;
end;
$$;

------------------------------------------------------------------------------------------------------------------------

create or replace function func.create_upsert_using_unique_index_and_default_primary_key(schema_n varchar, table_n varchar)
  returns void
  language plpgsql
as
$$
declare
  columns varchar[];
  primary_key_columns varchar[];
  unique_index_columns varchar[];
  distinct_columns varchar[]; -- columns - pk_columns - ui_columns
  upsert_columns varchar[]; -- columns - pk_columns
  unique_index_count numeric;
  upsert_sql varchar;
  params_literal varchar;
  params_decl_literal varchar;
  upsert_columns_literal varchar;
  unique_index_columns_literal varchar;
  do_sql varchar;
  distinct_columns_set_literal varchar;
  distinct_table_columns_literal varchar;
  distinct_excluded_columns_literal varchar;
  distinct_columns_is_distinct_from_literal varchar;
begin
  select array_agg(column_name :: varchar)
  into columns
  from
    information_schema.columns c
  where c.table_schema = schema_n
    and c.table_name = table_n;

  select count(i.relname)
  into unique_index_count
  from
    pg_index x
      join pg_class c
           on c.oid = x.indrelid
      join pg_class i
           on i.oid = x.indexrelid
      left join pg_namespace n
                on n.oid = c.relnamespace
  where ((c.relkind = any (array ['r'::char, 'm'::char])) and (i.relkind = 'i'::char))
    and x.indisunique
    and not x.indisprimary
    and n.nspname = schema_n
    and c.relname = table_n;

  if unique_index_count != 1 then
    raise exception '% unique indexes, expected exactly 1', unique_index_count;
  end if;

  select array_agg(a.attname)
  into primary_key_columns
  from
    pg_index x
      join pg_class c
           on c.oid = x.indrelid
      join pg_class i
           on i.oid = x.indexrelid
      left join pg_attribute a
                on a.attrelid = c.oid and a.attnum = any (x.indkey)
      left join pg_namespace n
                on n.oid = c.relnamespace
  where ((c.relkind = any (array ['r'::char, 'm'::char])) and (i.relkind = 'i'::char))
    and x.indisprimary
    and n.nspname = schema_n
    and c.relname = table_n;

  select array_agg(a.attname)
  into unique_index_columns
  from
    pg_index x
      join pg_class c
           on c.oid = x.indrelid
      join pg_class i
           on i.oid = x.indexrelid
      left join pg_attribute a
                on a.attrelid = c.oid and a.attnum = any (x.indkey)
      left join pg_namespace n
                on n.oid = c.relnamespace
  where ((c.relkind = any (array ['r'::char, 'm'::char])) and (i.relkind = 'i'::char))
    and not x.indisprimary
    and x.indisunique
    and n.nspname = schema_n
    and c.relname = table_n;

  select array_agg(v)
  into upsert_columns
  from
    unnest(columns) a(v)
  where v != all (primary_key_columns);

  select array_agg(v)
  into distinct_columns
  from
    unnest(upsert_columns) a(v)
  where v != all (unique_index_columns);

  select array_to_string(array_agg(format(
    '%I %s',
    v || '_',
    trim(leading '_' from c.udt_name) || case c.data_type when 'ARRAY' then '[]' else '' end
    )), ', ')
  into params_decl_literal
  from
    unnest(upsert_columns) a(v)
      join information_schema.columns c
           on c.table_name = table_n and c.table_schema = schema_n and c.column_name = v;

  select array_to_string(array_agg(format('%I', v || '_')), ', ')
  into params_literal
  from
    unnest(upsert_columns) a(v);

  select array_to_string(array_agg(format('%I', v)), ', ')
  into upsert_columns_literal
  from
    unnest(upsert_columns) a(v);

  select array_to_string(array_agg(format('%I', v)), ', ')
  into unique_index_columns_literal
  from
    unnest(unique_index_columns) a(v);

  do_sql = 'DO NOTHING';

  if cardinality(distinct_columns) > 0 then
    select array_to_string(array_agg(format('%I = %I', v, v || '_')), ', ')
    into distinct_columns_set_literal
    from
      unnest(distinct_columns) a(v);

    select array_to_string(array_agg(format('%I.%I', table_n, v)), ', ')
    into distinct_table_columns_literal
    from
      unnest(distinct_columns) a(v);

    select array_to_string(array_agg(format('excluded.%I', v)), ', ')
    into distinct_excluded_columns_literal
    from
      unnest(distinct_columns) a(v);

    distinct_columns_is_distinct_from_literal = format(
      '       (%s)
          IS DISTINCT FROM
              (%s)',
      distinct_table_columns_literal,
      distinct_excluded_columns_literal
      );

    do_sql = format(
      '   DO UPDATE SET
              %s
          WHERE
              %s',
      distinct_columns_set_literal,
      distinct_columns_is_distinct_from_literal
      );
  end if;

  upsert_sql = format(
    $Q$
                CREATE OR REPLACE FUNCTION %I.%I(%s) RETURNS VOID LANGUAGE SQL AS %s%s
                    INSERT INTO %I.%I (%s) VALUES (%s)
                    ON CONFLICT (%s)
                    %s;
                ;%s%s
            $Q$,
    schema_n, table_n || '_upsert', params_decl_literal, '$', '$',
    schema_n, table_n, upsert_columns_literal, params_literal,
    unique_index_columns_literal,
    do_sql,
    '$', '$'
    );
  -- RAISE NOTICE '%', upsert_sql;
  execute upsert_sql;
end;
$$;

------------------------------------------------------------------------------------------------------------------------

create or replace function func.create_upsert(schema_n varchar, table_n varchar)
  returns void
  language plpgsql
as
$$
declare
  unique_index_count numeric;
begin
  select count(i.relname)
  into unique_index_count
  from
    pg_index x
      join pg_class c
           on c.oid = x.indrelid
      join pg_class i
           on i.oid = x.indexrelid
      left join pg_namespace n
                on n.oid = c.relnamespace
  where ((c.relkind = any (array ['r'::char, 'm'::char])) and (i.relkind = 'i'::char))
    and x.indisunique
    and not x.indisprimary
    and n.nspname = schema_n
    and c.relname = table_n;

  if unique_index_count = 1 then
    perform create_upsert_using_unique_index_and_default_primary_key(schema_n, table_n);
  else
    perform create_upsert_using_primary_key(schema_n, table_n);
  end if;
end
$$;
