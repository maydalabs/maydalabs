-- On-chain bitcoin invoices for pilots, without a payment processor.
--
-- MaydaLabs takes bitcoin the same way BTCPay does — a fresh address per
-- invoice, watched on the chain — but the watching is done against the
-- public mempool.space API, which the homepage Bitcoin desk already uses.
-- No server, no API key, no custody: the address comes from a wallet the
-- operator controls and the private key never touches this system.
--
-- The USD price is locked at creation with the rate used, so an invoice
-- means one fixed amount of bitcoin, not a moving target.

create table public.pilot_invoices (
  id uuid primary key default gen_random_uuid(),
  pilot_id uuid not null references public.pilots (id) on delete cascade,
  label text not null check (char_length(label) between 1 and 120),
  amount_usd numeric(12, 2) not null check (amount_usd > 0 and amount_usd <= 1000000),
  amount_sats bigint not null check (amount_sats > 0 and amount_sats <= 2100000000000000),
  rate_usd numeric(14, 2) not null check (rate_usd > 0),
  -- A mainnet address the operator controls. Length bounds cover legacy,
  -- P2SH, bech32 and bech32m; the exact shape is validated in the app.
  address text not null check (char_length(address) between 26 and 90),
  status text not null default 'open'
    check (status in ('open', 'paid', 'expired', 'void')),
  -- Confirmed sats seen at the address, refreshed from the chain.
  observed_sats bigint not null default 0 check (observed_sats >= 0),
  txid text check (txid is null or char_length(txid) = 64),
  paid_at timestamptz,
  checked_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pilot_invoices_pilot_id_idx on public.pilot_invoices (pilot_id);
create index pilot_invoices_status_idx on public.pilot_invoices (status);

create trigger pilot_invoices_set_updated_at
  before update on public.pilot_invoices
  for each row execute function internal.set_updated_at();

-- ------------------------------------------------------------------ RLS

alter table public.pilot_invoices enable row level security;

revoke all on table public.pilot_invoices from anon, authenticated;
grant select, insert, update, delete on table public.pilot_invoices to authenticated;

-- A client sees the invoices on a pilot that is theirs; operators see all.
-- Clients never write: payment state comes from the chain, recorded server-side.
create policy "pilot_invoices_select_client_or_operator"
  on public.pilot_invoices for select
  to authenticated
  using (
    exists (select 1 from internal.operators o where o.user_id = (select auth.uid()))
    or exists (
      select 1 from public.pilots p
      where p.id = pilot_id and p.client_user_id = (select auth.uid())
    )
  );

create policy "pilot_invoices_insert_operator"
  on public.pilot_invoices for insert
  to authenticated
  with check (exists (select 1 from internal.operators o where o.user_id = (select auth.uid())));

create policy "pilot_invoices_update_operator"
  on public.pilot_invoices for update
  to authenticated
  using (exists (select 1 from internal.operators o where o.user_id = (select auth.uid())))
  with check (exists (select 1 from internal.operators o where o.user_id = (select auth.uid())));

create policy "pilot_invoices_delete_operator"
  on public.pilot_invoices for delete
  to authenticated
  using (exists (select 1 from internal.operators o where o.user_id = (select auth.uid())));
