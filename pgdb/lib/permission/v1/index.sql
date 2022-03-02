\echo 'permission\v1'

create table permission (
  permission_name varchar not null primary key check (permission_name::text ~ '^[A-Z][_A-Z0-9]+$')
);

create trigger permission_prevent_change
  before update or delete or truncate
  on permission
execute procedure func.prevent_change();
------------------------------------------------------------------------------------------------------
create table permission_group (
  permission_group_name varchar not null primary key check (permission_group_name::text ~ '^[A-Z][_A-Z0-9]+$')
);

create trigger permission_group_prevent_change
  before update or delete or truncate
  on permission_group
execute procedure func.prevent_change();
------------------------------------------------------------------------------------------------------
create table permission_x_permission_group (
  permission_x_permission_group_id uuid not null default func.tuid6(),
  permission_group_name varchar not null references permission_group,
  permission_name varchar not null references permission,
  relation_type varchar not null default 'add' check (relation_type::text = any
    (array ['add'::text, 'remove'::text, 'add_grant'::text]))
);
select add_history_to_table('permission_x_permission_group');
------------------------------------------------------------------------------------------------------
create table login_x_permission (
  login_id uuid not null references login on delete cascade,
  permission_name varchar not null references permission,
  relation_type varchar not null default 'add' check (relation_type::text = any
    (array ['add'::text, 'remove'::text, 'add_grant'::text])),
  primary key (login_id, permission_name)
);
select add_history_to_table('login_x_permission');
------------------------------------------------------------------------------------------------------
create table login_x_permission_group (
  login_id uuid not null references login on delete cascade,
  permission_group_name varchar not null references permission_group,
  primary key (login_id, permission_group_name)
);
select add_history_to_table('login_x_permission_group');
------------------------------------------------------------------------------------------------------