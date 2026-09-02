-- MaydaLabs v3 core data model.
--
-- Design notes:
-- * `public` holds only the tables the Data API must expose. Internal
--   authorization state lives in the non-exposed `internal` schema.
-- * `lead_intakes` is an intake buffer, not a CRM. Abidin stays the
--   canonical commercial record; `abidin_record_id` and
--   `transferred_to_abidin_at` exist for a deliberate manual transfer only.
-- * Raw claim tokens are never stored — only a SHA-256 hash of the
--   anonymous-map claim token.

create schema if not exists internal;

create or replace function internal.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- profiles

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 1 and 120),
  company_name text check (company_name is null or char_length(company_name) between 1 and 160),
  job_role text check (job_role is null or char_length(job_role) between 1 and 120),
  locale text not null default 'en' check (locale in ('en', 'tr', 'fr')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function internal.set_updated_at();

-- --------------------------------------------------------- multiplier_maps

create table public.multiplier_maps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  claim_token_hash text check (claim_token_hash is null or char_length(claim_token_hash) = 64),
  answers jsonb not null,
  result jsonb not null,
  rubric_version text not null,
  status text not null default 'saved' check (status in ('saved', 'discussed', 'archived')),
  locale text not null default 'en' check (locale in ('en', 'tr', 'fr')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Every row is addressable: by owner, or by hashed claim token until claimed.
  constraint multiplier_maps_addressable check (user_id is not null or claim_token_hash is not null)
);

create index multiplier_maps_user_id_idx on public.multiplier_maps (user_id);
create index multiplier_maps_claim_token_hash_idx on public.multiplier_maps (claim_token_hash);

create trigger multiplier_maps_set_updated_at
  before update on public.multiplier_maps
  for each row execute function internal.set_updated_at();

-- ------------------------------------------------------------ lead_intakes

create table public.lead_intakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  multiplier_map_id uuid references public.multiplier_maps (id) on delete set null,
  name text not null check (char_length(name) between 1 and 160),
  email text not null check (char_length(email) between 3 and 320),
  company text check (company is null or char_length(company) <= 200),
  company_stage text check (company_stage is null or char_length(company_stage) <= 40),
  primary_constraint text check (primary_constraint is null or char_length(primary_constraint) <= 40),
  desired_outcome text check (desired_outcome is null or char_length(desired_outcome) <= 40),
  budget_range text check (budget_range is null or char_length(budget_range) <= 40),
  timeline text check (timeline is null or char_length(timeline) <= 40),
  message text check (message is null or char_length(message) <= 4000),
  source text not null default 'website' check (char_length(source) <= 80),
  locale text not null default 'en' check (locale in ('en', 'tr', 'fr')),
  utm jsonb,
  consent_contact boolean not null default false,
  consent_contact_at timestamptz,
  consent_updates boolean not null default false,
  consent_updates_at timestamptz,
  review_status text not null default 'new'
    check (review_status in ('new', 'reviewing', 'needs_info', 'transferred', 'closed')),
  internal_tags text[] not null default '{}',
  internal_note text check (internal_note is null or char_length(internal_note) <= 4000),
  abidin_record_id text check (abidin_record_id is null or char_length(abidin_record_id) <= 120),
  transferred_to_abidin_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lead_intakes_user_id_idx on public.lead_intakes (user_id);
create index lead_intakes_review_status_idx on public.lead_intakes (review_status);
create index lead_intakes_created_at_idx on public.lead_intakes (created_at desc);

create trigger lead_intakes_set_updated_at
  before update on public.lead_intakes
  for each row execute function internal.set_updated_at();

-- ----------------------------------------------------------- subscriptions

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  email text not null unique check (char_length(email) between 3 and 320),
  topics text[] not null default '{updates}',
  locale text not null default 'en' check (locale in ('en', 'tr', 'fr')),
  status text not null default 'pending' check (status in ('pending', 'active', 'unsubscribed')),
  consent_at timestamptz,
  confirmation_at timestamptz,
  unsubscribed_at timestamptz,
  source text not null default 'website' check (char_length(source) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_user_id_idx on public.subscriptions (user_id);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function internal.set_updated_at();

-- ------------------------------------------------------ internal.operators

-- Explicit operator authorization for the internal lead-review surface.
-- Membership is managed manually (service credential / SQL), never from
-- the application UI.
create table internal.operators (
  user_id uuid primary key references auth.users (id) on delete cascade,
  label text check (label is null or char_length(label) <= 120),
  created_at timestamptz not null default now()
);
