-- What "trained" actually means.
--
-- Not fine-tuning. A co-founder feels trained because it accumulates: it
-- learns how you price, who the difficult client is, that you will not work
-- weekends, and it still knows those things next month. Until now MaydaOS
-- forgot everything the moment a conversation ended — the transcript was
-- there, but nothing was ever *learned* from it, and a model handed forty
-- messages of history reasons about the wrong five.
--
-- The difficult part is not remembering. It is being wrong.

create table public.os_company_memory (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.os_companies (id) on delete cascade,

  -- One thing, in plain language, readable on its own. Not a key-value pair:
  -- what makes this useful to a co-founder is the same thing that makes it
  -- useful to a person reading the list.
  fact text not null check (length(btrim(fact)) between 3 and 2000),

  kind text not null default 'fact'
    check (kind in ('fact', 'preference', 'constraint', 'person', 'decision')),

  -- Who wrote it down. 'person' when someone typed it, 'cofounder' when it
  -- learned it. The distinction matters when you are deciding whether to
  -- believe it.
  source text not null default 'cofounder' check (source in ('person', 'cofounder')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),

  -- Correction is retirement, never deletion.
  --
  -- A memory that turned out to be wrong is itself worth keeping: "it used to
  -- think this, and on the 16th I told it otherwise" is the difference
  -- between a system you can trust and one that quietly rewrites its own
  -- past. Everything else in MaydaOS is append-only for this reason and
  -- memory is the place it matters most.
  retired_at timestamptz,
  retired_by uuid references auth.users (id) on delete set null,
  retired_reason text check (retired_reason is null or length(retired_reason) <= 500)
);

create index os_company_memory_live_idx
  on public.os_company_memory (company_id, created_at desc)
  where retired_at is null;

alter table public.os_company_memory enable row level security;

revoke all on table public.os_company_memory from anon, authenticated;
grant select, insert on table public.os_company_memory to authenticated;

create policy "os_memory_member_read" on public.os_company_memory
  for select to authenticated
  using (public.os_is_member(company_id));

-- A person may teach it something directly. That is the other half of
-- "it knows your company": being able to tell it.
create policy "os_memory_member_write" on public.os_company_memory
  for insert to authenticated
  with check (public.os_is_member(company_id));

-- Nobody claims to be somebody else, and nobody writes a memory in as
-- retired.
create or replace function internal.os_memory_guard()
returns trigger
language plpgsql
security invoker
set search_path = public, internal
as $$
declare
  acting_user uuid := (select auth.uid());
begin
  if tg_op = 'INSERT' then
    -- A retirement is an act with a date and a person attached. It cannot be
    -- a property something is born with.
    new.retired_at := null;
    new.retired_by := null;
    new.retired_reason := null;

    if acting_user is not null then
      new.source := 'person';
      new.created_by := acting_user;
    end if;

    return new;
  end if;

  -- Updates come only through os_retire_memory, which is definer and sets
  -- exactly these three columns. Anything else rewriting history is refused
  -- whatever it claims to be.
  if new.fact is distinct from old.fact
     or new.kind is distinct from old.kind
     or new.source is distinct from old.source
     or new.company_id is distinct from old.company_id
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at
     or (old.retired_at is not null and new.retired_at is distinct from old.retired_at) then
    raise exception 'memory is corrected by retiring it, not by rewriting it'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger os_company_memory_guard
  before insert or update on public.os_company_memory
  for each row execute function internal.os_memory_guard();

create or replace function internal.os_memory_no_delete()
returns trigger
language plpgsql
security invoker
as $$
begin
  raise exception 'memory is retired, never deleted'
    using errcode = 'check_violation';
end;
$$;

create trigger os_company_memory_no_delete
  before delete on public.os_company_memory
  for each row execute function internal.os_memory_no_delete();

-- Retiring something it got wrong.
create or replace function public.os_retire_memory(p_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user uuid := (select auth.uid());
  owning_company uuid;
begin
  select company_id into owning_company
    from public.os_company_memory where id = p_id;

  if owning_company is null or not public.os_is_member(owning_company) then
    raise exception 'not your memory' using errcode = 'insufficient_privilege';
  end if;

  update public.os_company_memory
     set retired_at = now(),
         retired_by = acting_user,
         retired_reason = nullif(btrim(coalesce(p_reason, '')), '')
   where id = p_id and retired_at is null;
end;
$$;

revoke all on function public.os_retire_memory(uuid, text) from public, anon;
grant execute on function public.os_retire_memory(uuid, text) to authenticated, service_role;

comment on table public.os_company_memory is
  'What MaydaOS has learned about a company. Corrected by retiring a row and writing a new one, never by editing.';
