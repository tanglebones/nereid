set "audit.user" = "_DEMO_SETUP_";

do
$$
  declare
    admin_login_id_ uuid;
  begin
    select login_id into admin_login_id_ from login limit 1;
    -- make the first user of the system the admin

    if admin_login_id is null then
      insert into login (login) values ('cliffh') on conflict do nothing;
      select login_id into admin_login_id_ from login limit 1;
    end if;

    insert
    into
      login_x_permission_group (login_id, permission_group_name)
    values (admin_login_id_, 'ADMIN')
    on conflict do nothing;
  end
$$;

reset "audit.user";
