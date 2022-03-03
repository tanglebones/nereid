export const value = `
(
  select permission_name, relation_type
  from
    login_x_permission_group lpg
      join permission_x_permission_group ppg
           using (permission_group_name)
  where lpg.login_id = $(login_id)
)
union all
(
  select permission_name, relation_type from login_x_permission where login_id = $(login_id)
);

`;
