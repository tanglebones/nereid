(
  SELECT permission_name
       , relation_type
  FROM
    client_profile_x_permission_group upg
    JOIN permission_x_permission_group ppg
    USING (permission_group_name)
  WHERE upg.client_profile_id = $(client_profile_id)
  )
UNION ALL
(
  SELECT permission_name, relation_type FROM client_profile_x_permission WHERE client_profile_id = $(client_profile_id)
  );
