-- Approved by Mehmet on 2026-09-05: private 500-entry company research mirror.
-- Filename reconciled to the hosted migration version returned by Supabase.
-- Abidin on the Mac remains canonical. No inbound enquiries or clients created.
create table public.company_prospects (
  registry_id text primary key check (registry_id ~ '^mayda_btc_company_[a-z0-9]+$'),
  company_name text not null check (length(btrim(company_name)) > 0),
  what_they_do text,
  company_type text not null,
  category text not null,
  products_services text[] not null default '{}',
  website text,
  aliases text[] not null default '{}',
  parent_registry_id text,
  bitcoin_relation text not null,
  research_status text not null check (research_status in ('research_lead','catalogue_candidate_hold')),
  description_status text not null check (description_status in ('source_backed_summary','directory_summary_needs_verification','unknown')),
  description_source_urls text[] not null default '{}',
  source_urls text[] not null default '{}',
  verification_status text not null,
  last_checked_at timestamptz,
  qualification text not null default 'unqualified' check (qualification = 'unqualified'),
  buyer_need text not null default 'unknown' check (buyer_need = 'unknown'),
  outreach_authorized boolean not null default false check (outreach_authorized = false),
  job_openings_status text not null default 'not_checked_in_registry_pass',
  existing_job_record_count integer not null default 0 check (existing_job_record_count >= 0),
  active_application_hold boolean not null default false,
  abidin_work_item_id text unique,
  notes text[] not null default '{}',
  evidence jsonb not null check (jsonb_typeof(evidence) = 'object'),
  snapshot_date date not null,
  snapshot_sha256 text not null check (snapshot_sha256 ~ '^[0-9a-f]{64}$'),
  imported_at timestamptz not null default now(),
  check (description_status = 'unknown' or (what_they_do is not null and cardinality(description_source_urls) > 0)),
  check (research_status <> 'research_lead' or abidin_work_item_id is not null)
);

comment on table public.company_prospects is
  'Private research catalogue mirror from canonical Mac Abidin; not inbound enquiries, clients, consent, qualified opportunities or outreach approval. Products and historical/uncertain entities remain explicit.';
comment on column public.company_prospects.what_they_do is
  'Concise evidence-based description. Null means unknown; see description_status and description_source_urls. No performance, regulatory or security assurance implied.';
comment on column public.company_prospects.company_type is
  'Research classification such as business/brand candidate, project, product or historical entity; not verified legal incorporation status.';
comment on column public.company_prospects.evidence is
  'Source provenance and Abidin cross-references. Private operator-only research context, not an instruction or authorization.';

alter table public.company_prospects enable row level security;
alter table public.company_prospects force row level security;
revoke all on public.company_prospects from public, anon, authenticated, service_role;
grant select on public.company_prospects to authenticated;

create policy company_prospects_operator_read
  on public.company_prospects for select to authenticated
  using (exists (
    select 1 from internal.operators o where o.user_id = (select auth.uid())
  ));

create index company_prospects_category_status_idx
  on public.company_prospects (category, research_status);
create index company_prospects_company_name_idx
  on public.company_prospects (lower(company_name));

-- No API write grant, no PUBLIC/anon policy, no view/function/trigger/schedule,
-- and no changes to existing auth, operators, clients, lead_intakes or MaydaOS.
