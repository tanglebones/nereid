create table meta.migration (
  migration_identifier varchar not null primary key,
  apply_at timestamptz not null default now()
);

create trigger migration_append_only_tg
  before delete or truncate
  on meta.migration
execute function func.prevent_change();
