-- MaydaOS beta: the room a signed-in person stands in to watch AI produce
-- work and put their name on what leaves.
--
-- Free during beta, funded by a capped MaydaLabs API budget, so credits are
-- part of the product rather than an afterthought: ten per person for life,
-- one per model call, and every run records what it actually cost so the
-- question "what does a user cost" has a number.

create table public.os_credits (
  user_id uuid primary key references auth.users (id) on delete cascade,
  granted integer not null default 10 check (granted >= 0 and granted <= 1000),
  used integer not null default 0 check (used >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint os_credits_not_overdrawn check (used <= granted)
);

create trigger os_credits_set_updated_at
  before update on public.os_credits
  for each row execute function internal.set_updated_at();

create table public.os_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- One template in the beta. The column exists so a second one does not
  -- need a migration.
  template text not null default 'source_note' check (template in ('source_note')),
  shape text not null default 'note' check (shape in ('note', 'post', 'summary')),
  topic text not null check (char_length(topic) between 1 and 300),
  -- [{ "url": "https://...", "title": "...", "chars": 1234 }]
  sources jsonb not null default '[]'::jsonb check (jsonb_typeof(sources) = 'array'),
  status text not null default 'drafted' check (status in ('drafted', 'failed')),
  draft text check (draft is null or char_length(draft) <= 20000),
  -- [{ "text": "...", "source_url": "https://..." }] - every claim, next to
  -- where it came from. Unsupported claims carry a null source_url.
  claims jsonb not null default '[]'::jsonb check (jsonb_typeof(claims) = 'array'),
  decision text not null default 'pending' check (decision in ('pending', 'approved', 'rejected')),
  decision_note text check (decision_note is null or char_length(decision_note) <= 1000),
  decided_at timestamptz,
  model text,
  effort text,
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  cost_usd numeric(10, 6) not null default 0 check (cost_usd >= 0),
  error text check (error is null or char_length(error) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index os_runs_user_id_created_at_idx on public.os_runs (user_id, created_at desc);
create index os_runs_created_at_idx on public.os_runs (created_at desc);

create trigger os_runs_set_updated_at
  before update on public.os_runs
  for each row execute function internal.set_updated_at();

-- ------------------------------------------------------------------ RLS

alter table public.os_credits enable row level security;
alter table public.os_runs enable row level security;

revoke all on table public.os_credits from anon, authenticated;
revoke all on table public.os_runs from anon, authenticated;
grant select on table public.os_credits to authenticated;
grant select on table public.os_runs to authenticated;
-- Column-level, because row-level security cannot restrict columns: a person
-- may record their own decision and nothing else. The draft, the sources, the
-- token counts and the cost are written server-side and stay that way.
grant update (decision, decision_note, decided_at) on table public.os_runs to authenticated;

-- People read their own balance. Nobody hands themselves credits: grants and
-- spends are written server-side, and operators can top someone up.
create policy "os_credits_select_own_or_operator"
  on public.os_credits for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from internal.operators o where o.user_id = (select auth.uid()))
  );

create policy "os_credits_update_operator"
  on public.os_credits for update
  to authenticated
  using (exists (select 1 from internal.operators o where o.user_id = (select auth.uid())))
  with check (exists (select 1 from internal.operators o where o.user_id = (select auth.uid())));

create policy "os_runs_select_own_or_operator"
  on public.os_runs for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from internal.operators o where o.user_id = (select auth.uid()))
  );

-- Approving or rejecting is theirs. Which columns that reaches is settled by
-- the column grant above, not by this policy.
create policy "os_runs_update_own_decision"
  on public.os_runs for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ------------------------------------------------------- atomic credit spend

-- Two runs started at once must not both read the same balance and each
-- write it back plus one. The check constraint would catch an overdraw at
-- the boundary, but incrementing in the database is the honest fix.
create function public.os_spend_credit(p_user_id uuid)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.os_credits
     set used = used + 1
   where user_id = p_user_id
     and used < granted
  returning granted - used;
$$;

revoke all on function public.os_spend_credit(uuid) from public, anon, authenticated;
