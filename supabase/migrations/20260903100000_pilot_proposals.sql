-- "Prepared for you": the work MaydaLabs does for a prospect BEFORE the
-- outreach note is sent, so that signing in lands them on something made
-- for them rather than an empty portal.
--
-- One proposal per pilot. It carries the outreach angle, source-linked
-- observations about the prospect, a sample of the work already produced,
-- the pilot scope in weeks, the commercial terms, and — when the contact
-- started from a job application — how the pilot maps to the role.
-- Operators author it; the client reads it once `published` is true and
-- the pilot is theirs (claimed by verified email on sign-in).

create table public.pilot_proposals (
  id uuid primary key default gen_random_uuid(),
  pilot_id uuid not null unique references public.pilots (id) on delete cascade,
  origin text not null default 'outreach'
    check (origin in ('outreach', 'job_application', 'referral')),
  headline text not null check (char_length(headline) between 1 and 200),
  angle text not null check (char_length(angle) between 1 and 2000),
  -- [{ "text": "...", "source_url": "https://...", "source_label": "..." }]
  observations jsonb not null default '[]'::jsonb check (jsonb_typeof(observations) = 'array'),
  sample_title text check (sample_title is null or char_length(sample_title) <= 200),
  sample_body text check (sample_body is null or char_length(sample_body) <= 12000),
  sample_note text check (sample_note is null or char_length(sample_note) <= 600),
  -- [{ "label": "Week 1", "title": "...", "detail": "..." }]
  scope jsonb not null default '[]'::jsonb check (jsonb_typeof(scope) = 'array'),
  role_title text check (role_title is null or char_length(role_title) <= 200),
  role_note text check (role_note is null or char_length(role_note) <= 4000),
  terms text check (terms is null or char_length(terms) <= 2000),
  cta_label text check (cta_label is null or char_length(cta_label) <= 80),
  cta_url text check (cta_url is null or char_length(cta_url) <= 500),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger pilot_proposals_set_updated_at
  before update on public.pilot_proposals
  for each row execute function internal.set_updated_at();

-- ------------------------------------------------------------------ RLS

alter table public.pilot_proposals enable row level security;

revoke all on table public.pilot_proposals from anon, authenticated;
grant select, insert, update, delete on table public.pilot_proposals to authenticated;

-- Clients read the published proposal on their own pilot; operators see all.
create policy "pilot_proposals_select_client_or_operator"
  on public.pilot_proposals for select
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

create policy "pilot_proposals_insert_operator"
  on public.pilot_proposals for insert
  to authenticated
  with check (exists (select 1 from internal.operators o where o.user_id = (select auth.uid())));

create policy "pilot_proposals_update_operator"
  on public.pilot_proposals for update
  to authenticated
  using (exists (select 1 from internal.operators o where o.user_id = (select auth.uid())))
  with check (exists (select 1 from internal.operators o where o.user_id = (select auth.uid())));

create policy "pilot_proposals_delete_operator"
  on public.pilot_proposals for delete
  to authenticated
  using (exists (select 1 from internal.operators o where o.user_id = (select auth.uid())));
