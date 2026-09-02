-- Pilot dashboard: a client's view of their engagement.
--
-- `pilots` is the engagement record an operator creates for a client;
-- `pilot_updates` are the weekly reports, milestones, and notes the
-- operator publishes to it. Clients read their own pilot and its
-- published updates; operators (internal.operators) manage everything.
-- Rows are claimed by the client's OTP-verified email on sign-in, so a
-- pilot can be created before the client has an account.

create table public.pilots (
  id uuid primary key default gen_random_uuid(),
  client_user_id uuid references auth.users (id) on delete set null,
  client_email text not null check (char_length(client_email) between 3 and 320),
  company text not null check (char_length(company) between 1 and 200),
  workflow text not null check (char_length(workflow) between 1 and 200),
  offer text not null default 'ai_operations' check (offer in ('ai_operations', 'payments')),
  status text not null default 'proposed'
    check (status in ('proposed', 'scoping', 'installing', 'operating', 'measuring', 'completed', 'paused')),
  starts_on date,
  ends_on date,
  summary text check (summary is null or char_length(summary) <= 4000),
  next_step text check (next_step is null or char_length(next_step) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pilots_client_user_id_idx on public.pilots (client_user_id);
create index pilots_client_email_idx on public.pilots (client_email);

create trigger pilots_set_updated_at
  before update on public.pilots
  for each row execute function internal.set_updated_at();

create table public.pilot_updates (
  id uuid primary key default gen_random_uuid(),
  pilot_id uuid not null references public.pilots (id) on delete cascade,
  kind text not null default 'report' check (kind in ('report', 'milestone', 'note')),
  title text not null check (char_length(title) between 1 and 200),
  body text check (body is null or char_length(body) <= 8000),
  period_label text check (period_label is null or char_length(period_label) <= 60),
  output_count integer check (output_count is null or output_count >= 0),
  approval_latency_minutes integer check (approval_latency_minutes is null or approval_latency_minutes >= 0),
  source_coverage_pct numeric(5, 2) check (source_coverage_pct is null or (source_coverage_pct >= 0 and source_coverage_pct <= 100)),
  cost_usd numeric(10, 2) check (cost_usd is null or cost_usd >= 0),
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pilot_updates_pilot_id_idx on public.pilot_updates (pilot_id, created_at desc);

create trigger pilot_updates_set_updated_at
  before update on public.pilot_updates
  for each row execute function internal.set_updated_at();

-- ------------------------------------------------------------------ RLS

alter table public.pilots enable row level security;
alter table public.pilot_updates enable row level security;

revoke all on table public.pilots from anon, authenticated;
revoke all on table public.pilot_updates from anon, authenticated;

grant select, insert, update on table public.pilots to authenticated;
grant select, insert, update, delete on table public.pilot_updates to authenticated;

-- Clients see their own pilot; operators see the whole book.
create policy "pilots_select_client_or_operator"
  on public.pilots for select
  to authenticated
  using (
    (select auth.uid()) = client_user_id
    or exists (select 1 from internal.operators o where o.user_id = (select auth.uid()))
  );

create policy "pilots_insert_operator"
  on public.pilots for insert
  to authenticated
  with check (exists (select 1 from internal.operators o where o.user_id = (select auth.uid())));

create policy "pilots_update_operator"
  on public.pilots for update
  to authenticated
  using (exists (select 1 from internal.operators o where o.user_id = (select auth.uid())))
  with check (exists (select 1 from internal.operators o where o.user_id = (select auth.uid())));

-- Clients see published updates on their own pilot; operators see all.
create policy "pilot_updates_select_client_or_operator"
  on public.pilot_updates for select
  to authenticated
  using (
    exists (select 1 from internal.operators o where o.user_id = (select auth.uid()))
    or (
      published
      and exists (
        select 1 from public.pilots p
        where p.id = pilot_id and p.client_user_id = (select auth.uid())
      )
    )
  );

create policy "pilot_updates_insert_operator"
  on public.pilot_updates for insert
  to authenticated
  with check (exists (select 1 from internal.operators o where o.user_id = (select auth.uid())));

create policy "pilot_updates_update_operator"
  on public.pilot_updates for update
  to authenticated
  using (exists (select 1 from internal.operators o where o.user_id = (select auth.uid())))
  with check (exists (select 1 from internal.operators o where o.user_id = (select auth.uid())));

create policy "pilot_updates_delete_operator"
  on public.pilot_updates for delete
  to authenticated
  using (exists (select 1 from internal.operators o where o.user_id = (select auth.uid())));
