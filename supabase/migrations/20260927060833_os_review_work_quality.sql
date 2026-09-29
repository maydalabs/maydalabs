-- S1h: new reviewed Work must describe a known artifact/action pair and must
-- not copy the literal body of currently open Work in the same company.
-- Prepared for owner review. Never apply to a shared/remote database here.
--
-- This is deliberately narrower than a universal uniqueness constraint:
-- review RPCs serialize on the company row, but arbitrary manual Work edits
-- and inserts are not all governed by this guard. It prevents two reviewed
-- saves from racing into duplicate Work. It does not merge or rewrite records,
-- infer fuzzy equivalence, or promise uniqueness against every other writer.

create function internal.os_review_check_new_work(
  p_company uuid, p_body text, p_kind text, p_action text
)
returns void language plpgsql security invoker set search_path = '' as $$
declare expected_action text;
begin
  if p_kind is null or p_kind not in ('email','reply','post','note','research','decision') then
    raise exception 'review_work_action_mismatch' using errcode = 'P0001';
  end if;
  expected_action := case p_kind
    when 'email' then 'send' when 'reply' then 'send' when 'post' then 'publish'
    else null end;
  if p_action is distinct from expected_action then
    raise exception 'review_work_action_mismatch' using errcode = 'P0001';
  end if;

  -- Review RPCs already hold this lock before company membership, turn and
  -- proposal locks. Taking it again is harmless and also protects direct
  -- service-role inserts that use the reviewed-work provenance shape.
  perform 1 from public.os_companies where id = p_company for update;
  if not found then
    raise exception 'review access denied' using errcode = 'insufficient_privilege';
  end if;
  if exists (
    select 1 from public.os_work_items w
    where w.company_id = p_company
      and w.status not in ('completed','canceled')
      -- Title, kind, action and citations are model-selected labels: changing
      -- one must not permit an exact-body copy. No trimming/case folding.
      and w.notes collate "C" = p_body collate "C"
  ) then
    raise exception 'review_duplicate_work' using errcode = 'P0001';
  end if;
end; $$;

create function internal.os_review_proposal_work_quality()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  -- Historical receipts remain readable. The existing RPC's replay fast paths
  -- do not INSERT/UPDATE payload, so this guard does not invalidate a receipt.
  if new.payload->>'type' = 'work'
      and (tg_op = 'INSERT' or new.payload is distinct from old.payload) then
    perform internal.os_review_check_new_work(
      new.company_id, new.payload->>'body', new.payload->>'kind', new.payload->>'outwardAction'
    );
  end if;
  return new;
end; $$;

create trigger os_review_proposals_work_quality
before insert or update of payload on public.os_review_proposals
for each row execute function internal.os_review_proposal_work_quality();

create function internal.os_review_saved_work_quality()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  -- Exactly the provenance envelope emitted by os_review_decide. Other Work
  -- creation paths keep their existing behavior; this does not broaden grants.
  if new.metadata->>'by' = 'cofounder'
      and jsonb_typeof(new.metadata->'review') = 'object' then
    perform internal.os_review_check_new_work(
      new.company_id, new.notes, new.kind, new.required_action
    );
  end if;
  return new;
end; $$;

create trigger os_work_items_review_quality
before insert on public.os_work_items
for each row execute function internal.os_review_saved_work_quality();

revoke all on function internal.os_review_check_new_work(uuid,text,text,text),
  internal.os_review_proposal_work_quality(), internal.os_review_saved_work_quality()
  from public, anon, authenticated;
grant execute on function internal.os_review_check_new_work(uuid,text,text,text),
  internal.os_review_proposal_work_quality(), internal.os_review_saved_work_quality()
  to service_role;
