\set postfix _dba
\set user_dba :db_name:postfix

\set postfix _app
\set user_app :db_name:postfix

\set postfix _ro_app
\set user_ro_app :db_name:postfix

\set postfix _staff
\set user_staff :db_name:postfix

\set postfix _ro_staff
\set user_ro_staff :db_name:postfix

set search_path = func;
\i ../../stime/v1/index.sql
\i ../../util/v2/index.sql
\i ../../tuid/v6/index.sql
\i ../../upsert/v2/index.sql
\i ../../encrypt/v2/index.sql
\i ../../migration/v1/index.sql

set "audit.user" to 'SETUP';

set search_path = staff, func;
\i ../../history/v2/index.sql
set search_path = app, func;
\i ../../history/v2/index.sql

set search_path = func;

------------------------------------------------------------------------------------------------------
create table app.locale (
  locale_id uuid not null default func.tuid6() unique,
  locale_name varchar primary key
);
select app.add_history_to_table('locale');
------------------------------------------------------------------------------------------------------
create table app.jurisdiction (
  jurisdiction_id uuid not null default func.tuid6() unique,
  jurisdiction_name varchar primary key
);
select app.add_history_to_table('jurisdiction');
------------------------------------------------------------------------------------------------------
create table app.login (
  login_id uuid primary key default func.tuid6(),
  login varchar not null unique,
  display_name varchar not null,
  locale_name varchar not null references app.locale,
  raw_auth_response varchar not null
);
select app.add_history_to_table('login');
------------------------------------------------------------------------------------------------------
create table app.access_log (
  bearer_token varchar not null, -- NOT references, we want to retain the logs if login is deleted.
  at timestamptz default clock_timestamp() primary key,
  success boolean not null,
  note varchar not null default '',
  remote_address varchar not null
);
create index access_log_bearer_token_at on app.access_log (bearer_token, at);

create trigger access_log_append_only_tg
  before delete or truncate
  on app.access_log
execute function func.prevent_change();
------------------------------------------------------------------------------------------------------
create unlogged table app.session (
  session_id bytea default func.stuid() primary key,
  login_id uuid null references app.login,
  ivkey bytea,
  app_data jsonb default '{}'::jsonb not null,
  system_data jsonb default '{}'::jsonb not null,
  created_at timestamptz default current_timestamp not null,
  expire_at timestamptz default current_timestamp + '1 hour'::interval not null
);
------------------------------------------------------------------------------------------------------
set search_path = app, func;
\i ../../permission/v1/index.sql

------------------------------------------------------------------------------------------------------
create table staff.login (
  login_id uuid primary key default func.tuid6(),
  login varchar not null unique,
  display_name varchar not null,
  locale_name varchar not null references app.locale,
  raw_auth_response varchar not null
);
select staff.add_history_to_table('login');
------------------------------------------------------------------------------------------------------
create table staff.access_log (
  login varchar not null, -- NOT references, we want to retain the logs if login is deleted.
  at timestamptz default clock_timestamp() primary key,
  result varchar not null check (result in ('+', '-')),
  remote_address varchar not null
);
create index access_log_login_at on staff.access_log (login, at);

create trigger access_log_append_only_tg
  before delete or truncate
  on staff.access_log
execute function func.prevent_change();
------------------------------------------------------------------------------------------------------
create unlogged table staff.session (
  session_id bytea default stuid() primary key,
  login varchar references staff.login (login) on delete cascade, -- can be back filled after creation, so can be NULL
  data jsonb default '{}'::jsonb not null,
  created_at timestamptz default current_timestamp not null,
  expire_at timestamptz default current_timestamp + '1 hour'::interval not null
);
create index session_user_id on staff.session (login, created_at);

------------------------------------------------------------------------------------------------------
set search_path = staff, func;
\i ../../permission/v1/index.sql

------------------------------------------------------------------------------------------------------

create table staff.app_login_ivkey (
  app_login_id uuid references app.login,
  ivkey bytea not null
);
select staff.add_history_to_table('app_login_ivkey');

------------------------------------------------------------------------------------------------------
-- trigger to auto assign ivkey on session insert/update
------------------------------------------------------------------------------------------------------

create function func.app_session_ivkey_assign() returns trigger
  language plpgsql
  security definer -- runs as owner
as
$$
declare
  ivkey_ bytea;
begin
  if new.login_id is null then
    new.ivkey = null;
    return new;
  end if;

  insert
  into
    staff.app_login_ivkey (app_login_id, ivkey)
  values (new.login_id, func.gen_random_bytes(48))
  on conflict do nothing;

  select ivkey into ivkey_ from staff.app_login_ivkey where app_login_id = new.login_id;
  new.ivkey = ivkey_;
  return new;
end;
$$;

alter function func.app_session_ivkey_assign() owner to :user_staff;

create trigger app_session_ivkey_assign_tg
  before insert or update
  on app.session
  for each row
execute function func.app_session_ivkey_assign();
------------------------------------------------------------------------------------------------------

set "audit.user" = '_SETUP_';


------------------------------------------------------------------------------------------------------
-- base permissions
------------------------------------------------------------------------------------------------------

insert
into
  staff.permission (permission_name)
values
  ('ADMIN_SYSTEM_SETTINGS_UPDATE'),
  ('ADMIN_PERMISSION_CREATE'),
  ('ADMIN_PERMISSION_UPDATE'),
  ('ADMIN_PERMISSION_DELETE'),
  ('ADMIN_PERMISSION_VIEW'),
  ('ADMIN_PERMISSION_GROUP_CREATE'),
  ('ADMIN_PERMISSION_GROUP_UPDATE'),
  ('ADMIN_PERMISSION_GROUP_DELETE'),
  ('ADMIN_PERMISSION_GROUP_VIEW');

insert
into
  staff.permission_group (permission_group_name)
values
  ('ADMIN');

insert
into
  staff.permission_x_permission_group (permission_group_name, permission_name, relation_type)
select 'ADMIN',
  permission_name,
  'add_grant'
from
  staff.permission;

------------------------------------------------------------------------------------------------------
set search_path = app, func;
insert
into
  app.locale (locale_name)
values
  ('en'),
  ('fr');

insert
into
  app.jurisdiction (jurisdiction_name)
values
  (''),
  ('ca'),
  ('ca_ab'),
  ('ca_bc'),
  ('ca_mb'),
  ('ca_nb'),
  ('ca_nl'),
  ('ca_ns'),
  ('ca_nt'),
  ('ca_nu'),
  ('ca_on'),
  ('ca_pe'),
  ('ca_qc'),
  ('ca_sk'),
  ('ca_yt');

------------------------------------------------------------------------------------------------------

reset "audit.user";

------------------------------------------------------------------------------------------------------
