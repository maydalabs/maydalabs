-- Property three: it works while you are gone.
--
-- Everything needed to produce work already existed and had one thing
-- missing — a reason to start. `os_workflows` could gather sources and draft
-- from them, but only when a person pressed a button, which is the opposite
-- of a co-founder. And its output landed in `os_runs`, a list nobody's queue
-- ever read, so even a finished draft waited to be noticed.
--
-- This connects the two things already built and adds a clock. Nothing new
-- is invented: the worker uses the existing gather-and-draft pipeline, and
-- deposits into the spine, where the status machine and the approval gate
-- already govern what happens next.

-- A workflow that belongs to a company puts its output in that company's
-- queue. Left null, a workflow stays personal and behaves exactly as before.
alter table public.os_workflows
  add column company_id uuid references public.os_companies (id) on delete cascade,

  -- How often it should run itself. `manual` is the default, so nothing that
  -- exists today suddenly starts running on its own.
  add column cadence text not null default 'manual'
    check (cadence in ('manual', 'daily', 'weekly')),

  add column next_run_at timestamptz,

  -- What the outward act is, declared by the person who set the workflow up
  -- rather than guessed from the shape. Null means the output needs reading
  -- but nothing leaves the building, so no approval gates it.
  add column required_action text
    check (required_action is null or required_action = lower(btrim(required_action))),

  -- Set when a run fails in a way that should stop the schedule rather than
  -- retry into the same wall every hour.
  add column paused_reason text;

comment on column public.os_workflows.cadence is
  'manual | daily | weekly. Only a company workflow with a cadence other than manual is ever picked up by the worker.';
comment on column public.os_workflows.next_run_at is
  'When this is next due. The worker claims a workflow by moving this forward before it does any work.';

-- The link that was missing: this run produced that work item.
alter table public.os_runs
  add column item_id uuid references public.os_work_items (id) on delete set null,
  add column company_id uuid references public.os_companies (id) on delete cascade;

create index os_runs_item_id_idx on public.os_runs (item_id) where item_id is not null;
create index os_workflows_due_idx on public.os_workflows (next_run_at)
  where cadence <> 'manual' and active and company_id is not null;

-- A member may see the runs their company caused. Nobody may write one from
-- a browser: runs are what the worker did, and a record its subject can
-- shape is not a record. Personal runs (company_id null) stay owner-only,
-- exactly as they were.
grant select on table public.os_runs to authenticated;

create policy "os_runs_company_member" on public.os_runs
  for select to authenticated
  using (company_id is not null and public.os_is_member(company_id));

-- Scheduling arithmetic lives here so the worker and the page agree, and so
-- a cadence can never silently mean "never".
create or replace function internal.os_next_run(p_cadence text, p_from timestamptz)
returns timestamptz
language sql
immutable
as $$
  select case p_cadence
    when 'daily'  then p_from + interval '1 day'
    when 'weekly' then p_from + interval '7 days'
    else null
  end;
$$;

comment on function internal.os_next_run(text, timestamptz) is
  'Next due time for a cadence. Null for manual, which is what keeps a manual workflow out of the worker''s query.';

-- Claiming work, atomically.
--
-- Two workers running at once must never draft the same thing twice, and a
-- worker that dies mid-run must not wedge the schedule. Both are solved by
-- claiming: the due workflow's next_run_at moves forward in the same
-- statement that hands it out, so a second caller sees nothing due and a
-- crash costs one cycle rather than every cycle after it.
create or replace function public.os_claim_due_workflows(p_limit integer default 5)
returns setof public.os_workflows
language sql
security definer
set search_path = public, internal
as $$
  with due as (
    select id from public.os_workflows
     where cadence <> 'manual'
       and active
       and company_id is not null
       and paused_reason is null
       and next_run_at is not null
       and next_run_at <= now()
     order by next_run_at
     limit p_limit
     for update skip locked
  )
  update public.os_workflows w
     set next_run_at = internal.os_next_run(w.cadence, now())
    from due
   where w.id = due.id
  returning w.*;
$$;

-- It lives in public because that is the only schema PostgREST exposes and
-- the only one service_role can reach; `internal` is granted to
-- `authenticated` alone. Being reachable is not the same as being callable,
-- so every other role is revoked explicitly.
revoke all on function public.os_claim_due_workflows(integer) from public, anon, authenticated;
grant execute on function public.os_claim_due_workflows(integer) to service_role;

-- A workflow given a cadence but no first due time would sit forever. This
-- makes "starts running" mean what it says.
create or replace function internal.os_workflow_schedule()
returns trigger
language plpgsql
as $$
begin
  if new.cadence = 'manual' then
    new.next_run_at := null;
  elsif new.next_run_at is null
     or (tg_op = 'UPDATE' and new.cadence is distinct from old.cadence) then
    new.next_run_at := now();
  end if;

  return new;
end;
$$;

create trigger os_workflows_schedule
  before insert or update on public.os_workflows
  for each row execute function internal.os_workflow_schedule();

-- A run the worker performed had no user behind it. os_runs.user_id was
-- NOT NULL because every run used to begin with someone pressing a button;
-- filling it with the workflow's owner would put a person's name on work
-- they were not present for, in the one table whose value is being true.
-- Existing per-user policies compare user_id to auth.uid(), which a null
-- simply fails, so these rows are reachable only through the company policy
-- added above.
alter table public.os_runs alter column user_id drop not null;

-- Trusted server code could not move a work item at all.
--
-- internal.os_work_item_gate() is security invoker, so it runs as whoever
-- writes, and it calls internal.os_status_can_move(). `authenticated` has
-- usage on `internal`; service_role never did. Every update by the server
-- therefore failed with "permission denied for schema internal".
--
-- That failure was not visible because it looked like success: the approval
-- gate is supposed to refuse things, so a refusal was taken as the rule
-- working. It was the schema being unreachable. A test that only ever
-- asserts a refusal passes just as well when nothing works at all, so the
-- test that found this asserts the exact message, and there is a positive
-- test beside it.
--
-- `internal` is hidden from the API because PostgREST exposes `public`
-- alone, not because roles are kept out of it, so this grant matches what
-- `authenticated` already has.
grant usage on schema internal to service_role;
