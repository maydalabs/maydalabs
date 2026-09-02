-- MaydaLabs v3 security model: RLS on every exposed table, grants configured
-- separately from policies, and no anon privileges at all.
--
-- Principles applied:
-- * Anonymous submissions (lead intakes, subscriptions, unclaimed maps) go
--   exclusively through validated server actions using the service
--   credential. The `anon` role holds zero privileges on these tables.
-- * Authenticated users can only read/change their own appropriate rows.
-- * Operator access to lead intakes is authorized by membership in
--   `internal.operators` (a non-exposed schema), checked inside policies —
--   no SECURITY DEFINER function is required for this.
-- * Column-level UPDATE grants keep even operators away from columns the
--   application never edits in place.

-- Future objects in `public` start with no anon/authenticated privileges.
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated;

-- ---------------------------------------------------------------- profiles

alter table public.profiles enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant select, insert, update on table public.profiles to authenticated;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- --------------------------------------------------------- multiplier_maps

alter table public.multiplier_maps enable row level security;

revoke all on table public.multiplier_maps from anon, authenticated;
grant select, insert, delete on table public.multiplier_maps to authenticated;
grant update (status) on table public.multiplier_maps to authenticated;

create policy "multiplier_maps_select_own"
  on public.multiplier_maps for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- A signed-in save owns its row immediately and carries no claim token.
create policy "multiplier_maps_insert_own"
  on public.multiplier_maps for insert
  to authenticated
  with check ((select auth.uid()) = user_id and claim_token_hash is null);

create policy "multiplier_maps_update_own"
  on public.multiplier_maps for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "multiplier_maps_delete_own"
  on public.multiplier_maps for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ------------------------------------------------------------ lead_intakes

alter table public.lead_intakes enable row level security;

revoke all on table public.lead_intakes from anon, authenticated;
grant select on table public.lead_intakes to authenticated;
grant update (review_status, internal_tags, internal_note, abidin_record_id, transferred_to_abidin_at)
  on table public.lead_intakes to authenticated;

-- Owners see their own submissions; operators see the review queue.
create policy "lead_intakes_select_own_or_operator"
  on public.lead_intakes for select
  to authenticated
  using (
    (select auth.uid()) = user_id
    or exists (
      select 1 from internal.operators o
      where o.user_id = (select auth.uid())
    )
  );

-- Only operators change review state (columns limited by the grant above).
create policy "lead_intakes_update_operator"
  on public.lead_intakes for update
  to authenticated
  using (
    exists (
      select 1 from internal.operators o
      where o.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from internal.operators o
      where o.user_id = (select auth.uid())
    )
  );

-- ----------------------------------------------------------- subscriptions

alter table public.subscriptions enable row level security;

revoke all on table public.subscriptions from anon, authenticated;
grant select on table public.subscriptions to authenticated;
grant update (topics, locale, status, unsubscribed_at) on table public.subscriptions to authenticated;

create policy "subscriptions_select_own"
  on public.subscriptions for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "subscriptions_update_own"
  on public.subscriptions for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ------------------------------------------------------ internal.operators

-- `internal` is not in the Data API's exposed schemas; these grants exist
-- solely so the lead_intakes policies above can evaluate membership.
grant usage on schema internal to authenticated;
grant select on table internal.operators to authenticated;

alter table internal.operators enable row level security;

create policy "operators_select_self"
  on internal.operators for select
  to authenticated
  using ((select auth.uid()) = user_id);
