-- Bring your own key.
--
-- A company may choose which model speaks for its co-founder and pay for it
-- with its own key: Anthropic directly, or anything that speaks the
-- OpenAI-compatible dialect (OpenAI, xAI, Groq, Mistral, a self-hosted
-- gateway). The key is stored only as ciphertext sealed under a secret that
-- lives in the deployment environment and never in this database; the last
-- four characters stay readable so a person can recognise what they stored.
--
-- Grants are column-scoped, as everywhere else. A member can read that a
-- provider is set and which model; nobody signed in can read the ciphertext,
-- and only the service role, from a verified server action, can write it.

create table public.os_model_settings (
  company_id uuid primary key references public.os_companies(id) on delete cascade,
  provider text not null check (provider in ('anthropic', 'openai_compatible')),
  model text not null check (length(btrim(model)) between 1 and 120),
  base_url text check (
    base_url is null
    or base_url ~ '^https://[^\s?#@]+$'
    or base_url ~ '^http://(127\.0\.0\.1|localhost)(:[0-9]+)?(/[^\s?#@]*)?$'
  ),
  key_ciphertext text not null check (length(key_ciphertext) between 20 and 4000),
  key_last4 text not null check (length(key_last4) between 1 and 4),
  input_usd_per_million numeric(10, 4) not null default 0 check (input_usd_per_million between 0 and 1000),
  output_usd_per_million numeric(10, 4) not null default 0 check (output_usd_per_million between 0 and 1000),
  set_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((provider = 'anthropic' and base_url is null) or (provider = 'openai_compatible' and base_url is not null))
);

create trigger os_model_settings_set_updated_at before update on public.os_model_settings
  for each row execute function internal.set_updated_at();

alter table public.os_model_settings enable row level security;
revoke all on public.os_model_settings from public, anon, authenticated, service_role;
grant select (company_id, provider, model, base_url, key_last4, input_usd_per_million, output_usd_per_million, set_by, created_at, updated_at)
  on public.os_model_settings to authenticated;
grant select on public.os_model_settings to service_role;
grant insert (company_id, provider, model, base_url, key_ciphertext, key_last4, input_usd_per_million, output_usd_per_million, set_by)
  on public.os_model_settings to service_role;
grant update (provider, model, base_url, key_ciphertext, key_last4, input_usd_per_million, output_usd_per_million, set_by, updated_at)
  on public.os_model_settings to service_role;
grant delete on public.os_model_settings to service_role;

create policy os_model_settings_read on public.os_model_settings
  for select to authenticated using (public.os_is_member(company_id));

comment on table public.os_model_settings is
  'Which model speaks for a company, paid with the company''s own key. The key is AES-256-GCM ciphertext under MAYDAOS_KEY_SECRET; signed-in users can read everything about the setting except that column.';
comment on column public.os_companies.monthly_chat_usd is
  'The monthly ceiling on what the co-founder may spend for this company. Not writable by members through the API. When the company pays with its own key, the owner sets it through a verified server action, up to the table check; when MaydaLabs pays, it stays ours to set.';
