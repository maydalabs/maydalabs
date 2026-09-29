-- Two corrections to the review layer before it reaches production.
--
-- 1. Belonging to the company is the entitlement. The 16 September rule
--    (lib/osBetaAccess.ts) says the beta list had become the wrong question:
--    a founder who starts a company through the front door is a member and
--    is on no list. The first review migration gated the co-founder on
--    internal.os_beta_members with a fallback to internal.operators — a table
--    service_role cannot even read, so an operator who is not a beta member
--    got "permission denied" instead of an answer. Membership is what the
--    routes check, what RLS checks, and now what the RPC gate checks.
--
-- 2. What was decided stays decided. os_review_decide is careful never to
--    touch a saved or dismissed proposal, and os_review_finish never touches
--    a finished turn — but only the code was careful; the table allowed it.
--    A trigger now refuses the update, the same way finished work is frozen.

create or replace function internal.os_review_access(p_company uuid, p_actor uuid)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if p_company is null or p_actor is null then
    raise exception 'review access denied' using errcode = 'insufficient_privilege';
  end if;
  perform 1 from public.os_companies where id = p_company for update;
  if not found then raise exception 'review access denied' using errcode = 'insufficient_privilege'; end if;
  perform 1 from public.os_company_members where company_id = p_company and user_id = p_actor for share;
  if not found then raise exception 'review access denied' using errcode = 'insufficient_privilege'; end if;
end; $$;

drop policy os_review_turns_read on public.os_review_turns;
create policy os_review_turns_read on public.os_review_turns
  for select to authenticated using (public.os_is_member(company_id));
drop policy os_review_proposals_read on public.os_review_proposals;
create policy os_review_proposals_read on public.os_review_proposals
  for select to authenticated using (public.os_is_member(company_id));

create or replace function internal.os_review_proposal_freeze()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if old.status <> 'proposed' then
    raise exception 'a decided review proposal is frozen: what was saved or dismissed is what stays'
      using errcode = 'check_violation';
  end if;
  return new;
end; $$;
create trigger os_review_proposals_freeze before update on public.os_review_proposals
  for each row execute function internal.os_review_proposal_freeze();

create or replace function internal.os_review_turn_freeze()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if old.status <> 'running' then
    raise exception 'a finished review turn is frozen' using errcode = 'check_violation';
  end if;
  return new;
end; $$;
create trigger os_review_turns_freeze before update on public.os_review_turns
  for each row execute function internal.os_review_turn_freeze();

revoke all on function internal.os_review_proposal_freeze(), internal.os_review_turn_freeze()
  from public, anon, authenticated;

comment on function internal.os_review_access(uuid, uuid) is
  'The review gate: a member of the company, under a company lock. No beta list, no operator branch.';
comment on function internal.os_review_proposal_freeze() is
  'A saved or dismissed proposal cannot be updated again; revisions were append-only already.';
comment on function internal.os_review_turn_freeze() is
  'A completed or failed turn cannot be updated again; a late completion is a no-op by design.';
