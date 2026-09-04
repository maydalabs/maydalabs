-- Reused addresses: exchanges and custodial wallets hand out one deposit
-- address and keep it forever. The chain reports what an address has
-- received in its whole life, so an invoice compared against that total
-- would be marked paid by money that arrived months earlier, for something
-- else entirely.
--
-- Two guards. First, every invoice records what the address had already
-- received when it was written, and payment is measured as the increase
-- since. Second, an address can carry at most one invoice awaiting payment,
-- so a single arriving payment can never satisfy two of them.

alter table public.pilot_invoices
  add column baseline_sats bigint not null default 0
    check (baseline_sats >= 0);

comment on column public.pilot_invoices.baseline_sats is
  'Confirmed sats already received by this address when the invoice was written. Payment is measured as the increase over this figure, so a reused address cannot be settled by an older, unrelated payment.';

comment on column public.pilot_invoices.observed_sats is
  'Confirmed sats received for THIS invoice: the address total minus baseline_sats.';

create unique index pilot_invoices_one_open_per_address_idx
  on public.pilot_invoices (address)
  where status = 'open';
