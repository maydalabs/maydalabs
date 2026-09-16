-- Putting a workflow on a schedule, from the product rather than from psql.
--
-- The worker only ever picks up a workflow that belongs to a company, and
-- nothing a member could create had one: internal.os_workflow_member_guard()
-- stamped the owner and left company_id null, so a founder could set up work
-- and it would sit there forever. The loop was closed everywhere except at
-- the point a person touches it.

-- A member may now put their workflow in a company, and the database checks
-- that it is a company they actually belong to. Membership is not something
-- the form should be trusted to have verified.
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

  -- Work may only be filed into a company the person belongs to. Without
  -- this, a member could aim their drafts at somebody else's queue.
  if new.company_id is not null and not public.os_is_member(new.company_id) then
    raise exception 'not your company' using errcode = 'insufficient_privilege';
  end if;

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

-- A company's members see the company's workflows, not only their own. A
-- co-founder who cannot see what the other one scheduled is not a co-founder.
create policy "os_workflows_company_member" on public.os_workflows
  for select to authenticated
  using (company_id is not null and public.os_is_member(company_id));

-- What ran, what is due, and what it cost, in one place a person can read.
--
-- The counts and sums are computed here rather than in the page for the same
-- reason `waiting_days` was: two people looking at the same month's spend
-- should see the same number, and it should not depend on which rows a
-- particular query happened to select.
create or replace view public.os_activity with (security_invoker = on) as
  select
    w.id,
    w.company_id,
    w.name,
    w.shape,
    w.cadence,
    w.active,
    w.next_run_at,
    w.paused_reason,
    w.monthly_budget_usd,
    (extract(epoch from (w.next_run_at - now())) / 3600)::integer as due_in_hours,
    coalesce(month.spent_usd, 0)::numeric as spent_this_month_usd,
    coalesce(month.runs, 0)::integer as runs_this_month,
    last_run.finished_at as last_run_at,
    -- How long ago, from the database's clock. Reading the clock while
    -- rendering is impure, and two people looking at the same run should
    -- agree on its age regardless of when their browser painted.
    (extract(epoch from (now() - last_run.finished_at)) / 86400)::integer as last_run_days,
    last_run.status as last_run_status,
    last_run.item_id as last_run_item_id
  from public.os_workflows w
  left join lateral (
    select sum(r.cost_usd) as spent_usd, count(*) as runs
      from public.os_runs r
     where r.workflow_id = w.id
       and r.created_at >= date_trunc('month', now())
  ) month on true
  left join lateral (
    select r.created_at as finished_at, r.status, r.item_id
      from public.os_runs r
     where r.workflow_id = w.id
     order by r.created_at desc
     limit 1
  ) last_run on true
  where w.company_id is not null;

revoke all on public.os_activity from public, anon, authenticated;
grant select on public.os_activity to authenticated;

comment on view public.os_activity is
  'One row per company workflow: its schedule, what it has spent this month, and how its last run ended.';

-- The gate that actually decides, which was not the one in the application.
--
-- os_workflows_private_beta is a RESTRICTIVE policy, so it applies on top of
-- every permissive policy: nothing passes unless it passes this too. Widening
-- lib/osBetaAccess.ts let a founder reach the page and changed nothing about
-- what the database would accept — the save failed with the form's generic
-- message and the real refusal was here.
--
-- Belonging to a company is the entitlement now. os_beta_status stays valid
-- so the original private-beta members and operators are unaffected.

-- Asked from inside a policy, so it must not re-enter os_company_members'
-- own row-level security and recurse. Definer, and it answers only about the
-- caller.
create or replace function public.os_has_company()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.os_company_members m where m.user_id = (select auth.uid())
  );
$$;

revoke all on function public.os_has_company() from public, anon;
grant execute on function public.os_has_company() to authenticated, service_role;

drop policy if exists "os_workflows_private_beta" on public.os_workflows;
create policy "os_workflows_private_beta" on public.os_workflows
  as restrictive
  for all to public
  using (exists (select 1 from public.os_beta_status) or public.os_has_company())
  with check (exists (select 1 from public.os_beta_status) or public.os_has_company());

drop policy if exists "os_runs_private_beta" on public.os_runs;
create policy "os_runs_private_beta" on public.os_runs
  as restrictive
  for all to public
  using (exists (select 1 from public.os_beta_status) or public.os_has_company())
  with check (exists (select 1 from public.os_beta_status) or public.os_has_company());
