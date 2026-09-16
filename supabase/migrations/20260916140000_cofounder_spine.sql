-- MaydaOS: the co-founder's spine.
--
-- MaydaOS is Abidin made sellable. Abidin is the private system that has run
-- MaydaLabs for months, and what makes it feel like a co-founder rather than
-- a chat window is not that it talks. It is that it holds the state of a
-- company, brings back the few things only a person can decide, works between
-- visits, and never acts outward on its own. This migration is the faithful
-- translation of those four properties, and nothing else.
--
-- The vocabulary is Abidin's, kept deliberately rather than reinvented:
--
--   company      whose state this is. Abidin has one operator; a product has
--                many, so everything hangs off a company rather than a user.
--   work item    the atom. A piece of work with a lane, a status, the sources
--                behind it and the record of what happened to it.
--   status       a small machine, not a free-text field. The transitions are
--                Abidin's exactly.
--   approval     a separate record bound to one item AND one named action.
--                An approval to publish is not an approval to email.
--   event        append-only history. What the system claims it did has to be
--                checkable afterwards, or it is not accountability.

-- ------------------------------------------------------------- the company

create table public.os_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  -- What the co-founder needs to know to be useful and not generic: what this
  -- company sells and who it sells to, in the founder's own words.
  what_we_do text check (what_we_do is null or char_length(what_we_do) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger os_companies_set_updated_at
  before update on public.os_companies
  for each row execute function internal.set_updated_at();

-- A founder and a co-founder are both people. The table is ready for the
-- second one even while every company has exactly one.
create table public.os_company_members (
  company_id uuid not null references public.os_companies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

create index os_company_members_user_idx on public.os_company_members (user_id);

-- ----------------------------------------------------------- the work item

create table public.os_work_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.os_companies (id) on delete cascade,
  -- Abidin's lanes are the applications of the operating system. New lanes
  -- arrive as new values, so this is checked in code rather than pinned here.
  lane text not null check (char_length(lane) between 1 and 40),
  kind text not null check (char_length(kind) between 1 and 40),
  title text not null check (char_length(title) between 1 and 200),
  status text not null default 'pending' check (status in
    ('pending', 'triaged', 'drafted', 'review', 'approved', 'completed', 'blocked', 'canceled')),
  -- The action this item is waiting on a person for, if any. An approval is
  -- checked against this exact string, so "publish" never unlocks "email".
  required_action text check (required_action is null or char_length(required_action) <= 60),
  notes text not null default '' check (char_length(notes) <= 8000),
  tags text[] not null default '{}',
  -- Evidence travels with the item: [{ kind, label, ref }]
  sources jsonb not null default '[]'::jsonb check (jsonb_typeof(sources) = 'array'),
  artifacts jsonb not null default '[]'::jsonb check (jsonb_typeof(artifacts) = 'array'),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index os_work_items_company_status_idx on public.os_work_items (company_id, status, updated_at desc);

create trigger os_work_items_set_updated_at
  before update on public.os_work_items
  for each row execute function internal.set_updated_at();

-- ------------------------------------------------------------ the approval

create table public.os_approvals (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.os_work_items (id) on delete cascade,
  action text not null check (char_length(action) between 1 and 60),
  created_at timestamptz not null default now(),
  approved_by uuid references auth.users (id),
  approved_at timestamptz,
  notes text not null default '' check (char_length(notes) <= 2000),
  -- Abidin refuses a record that claims approval without an approver, and the
  -- reverse. A half-filled approval is the one that gets believed later.
  constraint os_approvals_both_or_neither check (
    (approved_by is null and approved_at is null)
    or (approved_by is not null and approved_at is not null)
  )
);

create index os_approvals_item_idx on public.os_approvals (item_id, action);

-- -------------------------------------------------------------- the record

create table public.os_work_item_events (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.os_work_items (id) on delete cascade,
  at timestamptz not null default now(),
  -- Who did it. Null is the system working between visits, which is exactly
  -- the case a person most needs to be able to audit later.
  actor uuid references auth.users (id),
  event text not null check (char_length(event) between 1 and 60),
  detail jsonb not null default '{}'::jsonb check (jsonb_typeof(detail) = 'object')
);

create index os_work_item_events_item_idx on public.os_work_item_events (item_id, at desc);

-- ------------------------------------------------- the machine, not a field
--
-- Abidin's transition map, copied exactly. A status is not a label a caller
-- writes; it is a move the system either permits or refuses. Completed and
-- canceled are terminal: work that finished stays finished, and the record of
-- it is what a person reads later.

create or replace function internal.os_status_can_move(current_status text, next_status text)
returns boolean
language sql
immutable
as $$
  select case current_status
    when 'pending'   then next_status in ('triaged', 'drafted', 'blocked', 'canceled')
    when 'triaged'   then next_status in ('drafted', 'review', 'blocked', 'canceled')
    when 'drafted'   then next_status in ('review', 'blocked', 'canceled')
    when 'review'    then next_status in ('drafted', 'approved', 'blocked', 'canceled')
    when 'approved'  then next_status in ('review', 'completed', 'blocked', 'canceled')
    when 'blocked'   then next_status in ('pending', 'triaged', 'drafted', 'review', 'approved', 'canceled')
    when 'completed' then false
    when 'canceled'  then false
    else false
  end;
$$;

comment on function internal.os_status_can_move(text, text) is
  'Abidin''s work-item transition map. Completed and canceled are terminal.';

-- Is the exact action this item is waiting on actually approved?
create or replace function public.os_action_approved(p_item_id uuid, p_action text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.os_approvals a
     where a.item_id = p_item_id
       and a.action = p_action
       and a.approved_by is not null
       and a.approved_at is not null
  );
$$;

revoke all on function public.os_action_approved(uuid, text) from public, anon;
grant execute on function public.os_action_approved(uuid, text) to authenticated;

-- The gate itself.
--
-- Two refusals live here rather than in any application. A status cannot take
-- a move the machine does not allow, and an item cannot reach `approved`
-- while the action it is waiting on is unapproved. That second rule is the
-- whole product: the system may prepare anything and may decide nothing.
create or replace function internal.os_work_item_gate()
returns trigger
language plpgsql
security invoker
set search_path = public, internal
as $$
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if not internal.os_status_can_move(old.status, new.status) then
      raise exception 'work item cannot move from % to %', old.status, new.status
        using errcode = 'check_violation';
    end if;

    if new.status = 'approved'
       and new.required_action is not null
       and not public.os_action_approved(new.id, new.required_action) then
      raise exception 'work item needs an approved "%" before it can be approved', new.required_action
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

create trigger os_work_items_gate
  before update on public.os_work_items
  for each row execute function internal.os_work_item_gate();

-- An approval is a record of a person deciding. Nothing may quietly rewrite
-- one after the fact: the item, the action and the approver are fixed once
-- the decision is made.
create or replace function internal.os_approval_immutable()
returns trigger
language plpgsql
security invoker
set search_path = public, internal
as $$
begin
  if old.approved_at is not null then
    if new.item_id is distinct from old.item_id
       or new.action is distinct from old.action
       or new.approved_by is distinct from old.approved_by
       or new.approved_at is distinct from old.approved_at then
      raise exception 'a recorded approval cannot be rewritten'
        using errcode = 'check_violation';
    end if;
  end if;

  if new.item_id is distinct from old.item_id or new.action is distinct from old.action then
    raise exception 'an approval stays bound to its item and action'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger os_approvals_immutable
  before update on public.os_approvals
  for each row execute function internal.os_approval_immutable();

-- History is append-only. An event that can be edited is not a record.
create or replace function internal.os_event_append_only()
returns trigger
language plpgsql
security invoker
as $$
begin
  raise exception 'the work record is append-only'
    using errcode = 'check_violation';
end;
$$;

create trigger os_work_item_events_append_only
  before update or delete on public.os_work_item_events
  for each row execute function internal.os_event_append_only();

-- ------------------------------------------------------ what needs you now
--
-- The co-founder's single most useful act: come back with the few things only
-- a person can settle, and say why each one is stuck. Everything the system
-- can move on its own is absent by construction.

create or replace view public.os_needs_you with (security_invoker = on) as
  select
    i.id,
    i.company_id,
    i.lane,
    i.kind,
    i.title,
    i.status,
    i.required_action,
    i.updated_at,
    case
      when i.status = 'blocked' then 'blocked'
      when i.status = 'review' then 'decide'
      when i.status = 'approved' and i.required_action is not null then 'finish'
      else 'other'
    end as route,
    -- Ordered by how long it has been waiting: the oldest decision is the one
    -- quietly costing the most.
    (now() - i.updated_at) as waiting_for
  from public.os_work_items i
  where i.status in ('review', 'approved', 'blocked');

revoke all on public.os_needs_you from public, anon, authenticated;
grant select on public.os_needs_you to authenticated;

-- ------------------------------------------------------------------- RLS
--
-- Everything is scoped to the companies a person belongs to. Membership is
-- the only key; there is no template, no shared row and no public read.

alter table public.os_companies enable row level security;
alter table public.os_company_members enable row level security;
alter table public.os_work_items enable row level security;
alter table public.os_approvals enable row level security;
alter table public.os_work_item_events enable row level security;

revoke all on table public.os_companies from anon, authenticated;
revoke all on table public.os_company_members from anon, authenticated;
revoke all on table public.os_work_items from anon, authenticated;
revoke all on table public.os_approvals from anon, authenticated;
revoke all on table public.os_work_item_events from anon, authenticated;

grant select, update on table public.os_companies to authenticated;
grant select on table public.os_company_members to authenticated;
grant select, insert, update on table public.os_work_items to authenticated;
grant select, insert, update on table public.os_approvals to authenticated;
-- Events are written by server code and read by people. Nobody updates or
-- deletes one, and the trigger above refuses even if a grant ever slipped.
grant select on table public.os_work_item_events to authenticated;

-- Membership, resolved once. Security definer so the policies below can ask
-- it without every caller needing to read the membership table directly.
create or replace function public.os_is_member(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.os_company_members m
     where m.company_id = p_company_id
       and m.user_id = (select auth.uid())
  );
$$;

revoke all on function public.os_is_member(uuid) from public, anon;
grant execute on function public.os_is_member(uuid) to authenticated;

create policy "os_companies_member_read" on public.os_companies
  for select to authenticated using (public.os_is_member(id));
create policy "os_companies_owner_write" on public.os_companies
  for update to authenticated
  using (exists (select 1 from public.os_company_members m
                  where m.company_id = id and m.user_id = (select auth.uid()) and m.role = 'owner'))
  with check (exists (select 1 from public.os_company_members m
                       where m.company_id = id and m.user_id = (select auth.uid()) and m.role = 'owner'));

create policy "os_company_members_read_own" on public.os_company_members
  for select to authenticated using (user_id = (select auth.uid()) or public.os_is_member(company_id));

create policy "os_work_items_member" on public.os_work_items
  for select to authenticated using (public.os_is_member(company_id));
create policy "os_work_items_member_insert" on public.os_work_items
  for insert to authenticated with check (public.os_is_member(company_id));
create policy "os_work_items_member_update" on public.os_work_items
  for update to authenticated
  using (public.os_is_member(company_id)) with check (public.os_is_member(company_id));

create policy "os_approvals_member" on public.os_approvals
  for select to authenticated
  using (exists (select 1 from public.os_work_items i
                  where i.id = item_id and public.os_is_member(i.company_id)));
create policy "os_approvals_member_insert" on public.os_approvals
  for insert to authenticated
  with check (exists (select 1 from public.os_work_items i
                       where i.id = item_id and public.os_is_member(i.company_id)));
create policy "os_approvals_member_update" on public.os_approvals
  for update to authenticated
  using (exists (select 1 from public.os_work_items i
                  where i.id = item_id and public.os_is_member(i.company_id)))
  with check (exists (select 1 from public.os_work_items i
                       where i.id = item_id and public.os_is_member(i.company_id)));

create policy "os_work_item_events_member" on public.os_work_item_events
  for select to authenticated
  using (exists (select 1 from public.os_work_items i
                  where i.id = item_id and public.os_is_member(i.company_id)));
