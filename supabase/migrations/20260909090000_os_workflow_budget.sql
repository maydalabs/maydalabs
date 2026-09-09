-- The budget moves from the person to the workflow.
--
-- Ten credits for life was a public-beta conversion device: a wall that a
-- stranger hits so a sales conversation can start. MaydaOS is no longer a
-- public beta. It is how MaydaLabs runs an installed workflow for a client,
-- so the money question changed with it: not "how many free runs does this
-- stranger get" but "what may this workflow spend in a month".
--
-- One number, set by the operator when the workflow is installed, enforced
-- against what the runs of that workflow actually cost. The global daily
-- ceiling (MAYDAOS_DAILY_USD_CAP) still stands behind it.
--
-- public.os_credits and public.os_spend_credit() are retired in code by this
-- release. They are deliberately NOT dropped here: dropping is a one-way door
-- and the existing rows are the only record of the beta's spend. A separate
-- migration can remove them once that history is no longer wanted.

alter table public.os_workflows
  add column monthly_budget_usd numeric(10, 2) not null default 5.00
    check (monthly_budget_usd >= 0 and monthly_budget_usd <= 10000);

comment on column public.os_workflows.monthly_budget_usd is
  'What this workflow may spend on model calls per calendar month (UTC). Enforced in the run action against the sum of os_runs.cost_usd for the workflow this month. Zero pauses the workflow without deactivating it.';

-- The run action now asks "what has this workflow spent this month", which is
-- a scan of one workflow's recent runs rather than one person's.
create index if not exists os_runs_workflow_id_created_at_idx
  on public.os_runs (workflow_id, created_at desc);

-- The column is written by operators through the existing workflow policies;
-- clients keep read-only access to the workflows they can see. No new grant
-- is needed, and none is given: a client must not set their own budget.
