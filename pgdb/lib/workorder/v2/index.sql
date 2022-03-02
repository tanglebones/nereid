-- assumes pgcrypto loaded in func
-- assumes tuid6 in func
-- set search path before including!

create table workorder (
  workorder_id uuid not null primary key,
  context_name varchar not null,
  current_content_hash varchar not null,
  frozen_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  constraint workorder_context_name_check check (((context_name)::text ~ '^[\x20-\x7e]+$'::text))
);

create unique index workorder_allow_only_one_not_frozen on workorder using btree (context_name) where (frozen_at is null);

create table workorder_n_state (
  -- workorder_n_state doesn't have it's own workorder_n_state_id as content_hash is effectively the id.
  content_hash varchar not null unique,
  workorder_id uuid not null references workorder,
  state jsonb not null,
  created_at timestamp with time zone default now() not null
);

create function workorder_hash(workorder_id uuid, context_name varchar, state jsonb)
  returns text
  language sql
  immutable strict
as
$$
select translate(
  encode(func.digest(workorder_id::varchar || E'\n' || context_name || E'\n' || state::varchar, 'sha1'), 'base64'),
  '=/+', -- unsafe in a URL param
  '.-_' -- safe in a URL param
  )
$$;

-- The return type of the functions is normalized to:
-- (
--   workorder_id uuid,
--   context_name VARCHAR,
--   content_hash VARCHAR,
--   current_content_hash VARCHAR,
--   state jsonb,
--   frozen_at timestamptz
-- )
-- to make it easier to compose in queries


-- lookup by context name and content hash
create function workorder_by_content_hash(context_name_ varchar, content_hash_ varchar)
  returns table
  (
    workorder_id uuid,
    content_hash varchar,
    current_content_hash varchar,
    context_name varchar,
    state jsonb,
    frozen_at timestamptz
  )
  language sql
as
$$
select wo.workorder_id,
  ws.content_hash,
  wo.current_content_hash,
  wo.context_name,
  ws.state,
  wo.frozen_at as frozen_at
from
  workorder wo
    join workorder_n_state ws using (workorder_id)
where ws.content_hash = content_hash_
  and wo.context_name = context_name_
$$;

-- return the active workorder for a context name or no rows if there is none
create function workorder_get_active(context_name_ varchar)
  returns table
  (
    workorder_id uuid,
    context_name varchar,
    content_hash varchar,
    current_content_hash varchar,
    state jsonb,
    frozen_at timestamptz
  )
  language plpgsql
as
$$
declare
  r record; -- because the return table fields become local variables we have to avoid using them in the queries
  -- and instead select into a record.
begin
  select *
  into r
  from
    workorder wo
  where wo.context_name = context_name_
    and wo.frozen_at is null;

  if r.workorder_id is not null then -- an active work order already exists
  -- update the output row
    workorder_id = r.workorder_id;
    current_content_hash = r.current_content_hash;
    content_hash = r.current_content_hash;
    context_name = r.context_name;

    -- get the associated state
    select wos.state
    into r
    from
      workorder_n_state wos
    where wos.content_hash = current_content_hash;

    -- update the output row
    state = r.state;
    return next; -- return the output row
  end if;
end;
$$;

-- gets the active workorder for the context name
-- if no active workorder exists creates one using the default state and returns it.
create function workorder_vivify(context_name_ varchar, default_state jsonb)
  returns table
  (
    workorder_id uuid,
    context_name varchar,
    content_hash varchar,
    current_content_hash varchar,
    state jsonb,
    frozen_at timestamptz
  )
  language plpgsql
as
$$
declare
  r record; -- because the return table fields become local variables we have to avoid using them in the queries
  -- and instead select into a record.
begin
  select *
  into r
  from
    workorder wo
  where wo.context_name = context_name_
    and wo.frozen_at is null;

  if r.workorder_id is not null then -- an active work order already exists
  -- update the output row
    workorder_id = r.workorder_id;
    current_content_hash = r.current_content_hash;
    content_hash = r.current_content_hash;
    context_name = r.context_name;

    -- get the associated state
    select wos.state
    into r
    from
      workorder_n_state wos
    where wos.content_hash = current_content_hash;

    -- update the output row
    state = r.state;
  else
    -- setup the data for the new work order
    workorder_id = func.tuid6();
    state = default_state;
    current_content_hash = workorder_hash(workorder_id, context_name_, state);
    content_hash = current_content_hash;
    context_name = context_name_;

    -- create a new work_order
    begin
      -- this can fail with a duplicate
      insert
      into
        workorder (workorder_id, context_name, current_content_hash)
      values (workorder_id, context_name, current_content_hash);

      insert
      into
        workorder_n_state (workorder_id, state, content_hash)
      values (workorder_id, state, current_content_hash)
      on conflict do nothing;

      -- it is possible another tx already created it
    exception
      when unique_violation then
        -- grab the other one that was created in parallel
        select *
        into r
        from
          workorder wo
        where wo.context_name = context_name_
          and wo.frozen_at is null;

        -- it's also possible a parallel one was created
        -- and then frozen before we got it...
        -- at which point we give up because
        -- that really should not happen. (I know, famous last words)
        if r.current_content_hash is null then
          raise exception 'Could not create workorder for %; duplicate detected.', context_name_;
        end if;

        -- update the output row
        current_content_hash = r.current_content_hash;
        content_hash = r.current_content_hash;
        workorder_id = r.workorder_id;

        -- get the associated state
        select *
        into r
        from
          workorder_n_state wos
        where wos.content_hash = current_content_hash;

        -- update the output row
        state = r.state;
    end;
  end if;

  return next; -- return the output row
end;
$$;

-- update the active workorder for context name to a new state
-- does nothing if their is no active workorder, and returns no row
-- returns the new workorder row on success
create function workorder_update(context_name_ varchar, new_state_ jsonb)
  returns table
  (
    workorder_id uuid,
    context_name varchar,
    content_hash varchar,
    current_content_hash varchar,
    state jsonb,
    frozen_at timestamptz
  )
  language plpgsql
as
$$
declare
  r record;
  workorder_id_ uuid;
  current_content_hash_ varchar;
begin
  -- set the output field
  context_name = context_name_;

  select * into r from workorder_get_active(context_name_);

  if r.workorder_id is null then
    -- no unfrozen work_order exists
    return; -- not NEXT, i.e. return no row, nothing was saved
  end if;

  -- set the output field
  workorder_id = r.workorder_id;
  state = r.state;

  current_content_hash = workorder_hash(workorder_id, context_name_, new_state_);
  content_hash = current_content_hash;

  -- if it actually changed.
  if current_content_hash != r.current_content_hash then
    insert
    into
      workorder_n_state (content_hash, workorder_id, state)
    values
      (current_content_hash, workorder_id, new_state_)
      -- could already exist from a previous update
    on conflict do nothing;

    -- set the output field
    state = new_state_;

    -- update the current content hash so resuming will now resume from here
    workorder_id_ = workorder_id;
    current_content_hash_ = current_content_hash;

    update workorder
    set current_content_hash = current_content_hash_
    where workorder.workorder_id = workorder_id_
      and workorder.current_content_hash is distinct from current_content_hash_;
  end if;

  return next; -- return the data
end;
$$;

-- like update, but will only update the workorder if the current content hash matches the given
-- original content hash, returning the current state if it doesn't match.
-- the updated field can be used to quickly check if the update occurred.
create function workorder_update_if_unchanged(context_name_ varchar, original_content_hash_ varchar, new_state_ jsonb)
  returns table
  (
    workorder_id uuid,
    context_name varchar,
    content_hash varchar,
    current_content_hash varchar,
    state jsonb,
    frozen_at timestamptz,
    updated boolean
  )
  language plpgsql
as
$$
declare
  r record;
  workorder_id_ uuid;
  current_content_hash_ varchar;
begin
  -- set the output field
  context_name = context_name_;
  updated = false;

  select *
  into r
  from
    workorder_get_active(context_name_);

  workorder_id = r.workorder_id;
  state = r.state;

  if r.current_content_hash != original_content_hash_ then
    current_content_hash = r.current_content_hash;
    content_hash = r.current_content_hash;
    -- conflict, return the latest state with updated as false
    return next;
  end if;

  current_content_hash = workorder_hash(workorder_id, context_name_, new_state_);
  content_hash = r.current_content_hash;

  -- only bother if it really is a new state
  if current_content_hash != original_content_hash_ then
    insert
    into
      workorder_n_state (content_hash, workorder_id, state)
    values
      (current_content_hash, workorder_id, new_state_)
      -- might match an previously existing state, which is fine.
    on conflict do nothing;

    -- set the output field
    state = new_state_;

    -- update the current content hash of the work flow
    workorder_id_ = workorder_id;
    current_content_hash_ = current_content_hash;
    update workorder wo
    set current_content_hash = current_content_hash_
    where wo.workorder_id = workorder_id_
      and wo.current_content_hash is distinct from current_content_hash_;
  end if;
  -- updated here really means the state matches what the request to make it provided
  -- even if that technically doesn't change it.
  updated = true;
  return next;
end;
$$;

create function workorder_freeze(context_name_ varchar, original_content_hash_ varchar)
  returns table
  (
    workorder_id uuid,
    context_name varchar,
    content_hash varchar,
    current_content_hash varchar,
    state jsonb,
    frozen_at timestamptz
  )
  language plpgsql
as
$$
declare
  r record;
  u record;
  workorder_id_ uuid;
begin
  -- set the output field
  context_name = context_name_;
  content_hash = original_content_hash_;

  select *
  into r
  from
    workorder_get_active(context_name_);
  workorder_id = r.workorder_id;

  -- set the output field
  current_content_hash = r.current_content_hash;
  state = r.state;

  if r.current_content_hash = original_content_hash_ then
    -- only freeze the work order if it hasn't changed since we last looked at it.
    workorder_id_ = workorder_id;

    update workorder wo
    set frozen_at = now()
    where wo.workorder_id = workorder_id_
      and wo.current_content_hash = original_content_hash_
    returning wo.frozen_at into u;

    -- frozen_at will only be non null if we actually froze the work order
    frozen_at = u.frozen_at;
  end if;

  return next; -- return the row
end;
$$;
