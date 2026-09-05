-- Private beta, not a public account entitlement. No existing users are
-- enrolled automatically. Operators retain access; testers require a deliberate
-- service-role/SQL membership grant. The membership is live, not cached in JWTs.
create table internal.os_beta_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  granted_at timestamptz not null default now()
);

alter table internal.os_beta_members enable row level security;
revoke all on internal.os_beta_members from public, anon, authenticated;
grant select on internal.os_beta_members to authenticated;
grant all on internal.os_beta_members to service_role;
create policy "os_beta_members_select_self"
  on internal.os_beta_members for select to authenticated
  using (user_id = (select auth.uid()));

create view public.os_beta_status with (security_invoker = on) as
  select user_id from internal.os_beta_members
  union
  select user_id from internal.operators;
revoke all on public.os_beta_status from public, anon, authenticated;
grant select on public.os_beta_status to authenticated;

-- RESTRICTIVE: this must hold in addition to the existing ownership/column
-- policies. A template, an old credit grant, or an old run is not an invite.
create policy "os_workflows_private_beta"
  on public.os_workflows as restrictive for all to authenticated
  using (exists (select 1 from public.os_beta_status))
  with check (exists (select 1 from public.os_beta_status));
create policy "os_runs_private_beta"
  on public.os_runs as restrictive for all to authenticated
  using (exists (select 1 from public.os_beta_status))
  with check (exists (select 1 from public.os_beta_status));
create policy "os_credits_private_beta"
  on public.os_credits as restrictive for all to authenticated
  using (exists (select 1 from public.os_beta_status))
  with check (exists (select 1 from public.os_beta_status));
