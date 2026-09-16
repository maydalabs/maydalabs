-- Self-serve workflows: the wall between an internal tool and a product.
--
-- Until now a workflow existed only if an operator typed it in by hand at
-- /internal/os. Whatever else a product turns out to be, the person who paid
-- for it has to be able to set up their own work without asking us first, so
-- this is the piece that has to move.
--
-- What a member may now do: create, edit and delete workflows they own.
-- What they may not do, enforced here rather than in the application, because
-- the database is the only place a guarantee survives a bug in a form:
--
--   * own a template (owner_user_id null). Templates stay ours.
--   * set or raise monthly_budget_usd. That is the money lever and it belongs
--     to the operator alone; a member who could raise it could spend our API
--     balance at will.
--   * move a workflow to another person, or rename its key after creation.
--   * keep more than five of them.
--
-- Column grants cannot express any of this. Operators and members are both
-- the `authenticated` role, and a grant cannot tell them apart, so the rules
-- live in a trigger that can. The table-wide insert/update/delete grant from
-- migration 12 already permits the statement; policies and this trigger decide
-- what survives it. The restrictive private-beta policy still applies on top,
-- so none of this reaches anyone who is not a member.

create or replace function internal.os_workflow_member_guard()
returns trigger
language plpgsql
security invoker
set search_path = public, internal
as $$
declare
  acting_user uuid := (select auth.uid());
  owned integer;
begin
  -- Order matters here. A caller with no auth.uid() is the service
  -- credential: trusted server code that already bypasses row-level
  -- security, and never a visitor, because `anon` holds no write grant on
  -- this table at all. It must return before anything reads internal.*,
  -- because only `authenticated` has usage on that schema; computing the
  -- operator check in DECLARE instead broke every service-role insert with
  -- "permission denied for schema internal".
  if acting_user is null then
    return new;
  end if;

  -- An operator installs on a client's behalf and sets the budget. Nothing
  -- below applies to them.
  if exists (select 1 from internal.operators o where o.user_id = acting_user) then
    return new;
  end if;

  -- A member's workflow is always their own, and never a template.
  new.owner_user_id := acting_user;

  if tg_op = 'INSERT' then
    -- The default, not a chosen number. Raising it stays operator-only.
    new.monthly_budget_usd := 5.00;

    select count(*) into owned
      from public.os_workflows
     where owner_user_id = acting_user;

    if owned >= 5 then
      raise exception 'workflow limit reached: five per person'
        using errcode = 'check_violation';
    end if;
  else
    -- Neither the money nor the identity of the row may move.
    new.monthly_budget_usd := old.monthly_budget_usd;
    new.key := old.key;
  end if;

  return new;
end;
$$;

comment on function internal.os_workflow_member_guard() is
  'Forces a member''s workflow to be their own, pins monthly_budget_usd out of their reach, and caps them at five. Operators pass through untouched.';

create trigger os_workflows_member_guard
  before insert or update on public.os_workflows
  for each row execute function internal.os_workflow_member_guard();

-- The policies say who may write which row. The trigger above has already
-- forced owner_user_id to the caller, so these checks describe what is left.
create policy "os_workflows_insert_own"
  on public.os_workflows for insert
  to authenticated
  with check (owner_user_id = (select auth.uid()));

create policy "os_workflows_update_own"
  on public.os_workflows for update
  to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

create policy "os_workflows_delete_own"
  on public.os_workflows for delete
  to authenticated
  using (owner_user_id = (select auth.uid()));
