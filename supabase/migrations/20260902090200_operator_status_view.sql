-- Self-service operator check for the internal review surface.
--
-- `internal` is not an exposed API schema, so the application cannot ask
-- "am I an operator?" directly. This view re-exposes exactly one fact —
-- the caller's own membership — through the public schema. It runs with
-- security_invoker, so internal.operators' RLS ("select self only")
-- applies to the caller: an operator sees their own row, everyone else
-- sees nothing.

create view public.operator_status
  with (security_invoker = on) as
  select user_id from internal.operators;

revoke all on public.operator_status from anon, authenticated;
grant select on public.operator_status to authenticated;
