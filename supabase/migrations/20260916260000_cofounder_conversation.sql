-- The co-founder you can talk to.
--
-- Until now MaydaOS could only be operated: press a button, approve a draft,
-- set up a workflow. There was no way to say "look into this" or "what do you
-- think", which is the thing that separates a co-founder from an inbox.
--
-- What makes this not a chat window is everything built before it. The
-- conversation reads the company's real state, and anything it decides to do
-- goes through the same gate a person's own actions go through: it may
-- prepare, and it may not decide. That is not a rule in the prompt. The
-- prompt can be argued with; the database cannot.

create table public.os_threads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.os_companies (id) on delete cascade,
  title text not null default 'Conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index os_threads_company_idx on public.os_threads (company_id, updated_at desc);

create table public.os_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.os_threads (id) on delete cascade,
  -- `person` or `cofounder`. Not "user" and "assistant": this record is read
  -- by people, and the two words that matter are who said it.
  role text not null check (role in ('person', 'cofounder')),
  body text not null check (length(body) <= 40000),
  -- Null for the co-founder, which is the same honesty os_runs keeps: work
  -- nobody was present for is not attributed to anybody.
  actor uuid references auth.users (id) on delete set null,
  -- What it cost, when it cost anything.
  input_tokens integer,
  output_tokens integer,
  cost_usd numeric(10, 6),
  created_at timestamptz not null default now()
);

create index os_messages_thread_idx on public.os_messages (thread_id, created_at);

alter table public.os_threads enable row level security;
alter table public.os_messages enable row level security;

revoke all on table public.os_threads from anon, authenticated;
revoke all on table public.os_messages from anon, authenticated;

-- A conversation belongs to the company, not to whoever opened it: a
-- co-founder the other founder cannot read is a private assistant wearing the
-- word.
grant select on table public.os_threads to authenticated;
grant select on table public.os_messages to authenticated;

create policy "os_threads_member" on public.os_threads
  for select to authenticated
  using (public.os_is_member(company_id));

create policy "os_messages_member" on public.os_messages
  for select to authenticated
  using (exists (
    select 1 from public.os_threads t
     where t.id = thread_id and public.os_is_member(t.company_id)
  ));

-- Nobody writes a message from a browser.
--
-- Both sides are written by the server, inside the same request that called
-- the model, because a transcript whose subject can compose either half of it
-- is not a transcript. This is the same reason os_work_item_events holds no
-- insert grant.
create or replace function internal.os_message_immutable()
returns trigger
language plpgsql
security invoker
as $$
begin
  raise exception 'the conversation is append-only'
    using errcode = 'check_violation';
end;
$$;

create trigger os_messages_append_only
  before update or delete on public.os_messages
  for each row execute function internal.os_message_immutable();

create trigger os_threads_set_updated_at
  before update on public.os_threads
  for each row execute function internal.set_updated_at();

-- What a company may spend on talking, per calendar month. Same shape as a
-- workflow's budget and for the same reason: a conversation is the one part
-- of this product where cost follows enthusiasm rather than a schedule.
alter table public.os_companies
  add column monthly_chat_usd numeric(10, 2) not null default 5.00
    check (monthly_chat_usd >= 0 and monthly_chat_usd <= 500);

comment on column public.os_companies.monthly_chat_usd is
  'Ceiling for conversation spend per calendar month. Raising it is not a self-serve action.';

-- Spend so far this month, asked as the caller so a company can only ever see
-- its own. Definer because os_messages joins through os_threads and the sum
-- must not depend on which rows a policy happened to admit.
create or replace function public.os_chat_spent_this_month(p_company_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(m.cost_usd), 0)::numeric
    from public.os_messages m
    join public.os_threads t on t.id = m.thread_id
   where t.company_id = p_company_id
     and m.created_at >= date_trunc('month', now())
     and public.os_is_member(p_company_id);
$$;

revoke all on function public.os_chat_spent_this_month(uuid) from public, anon;
grant execute on function public.os_chat_spent_this_month(uuid) to authenticated, service_role;
