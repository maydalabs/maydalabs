-- Approval has to lead somewhere.
--
-- The gate has been airtight since the spine: nothing reaches `approved`
-- without a person signing the exact action. But nothing ever left
-- `approved` either. No code anywhere moved an item to `completed`, so a
-- founder could approve "send" and the item would sit there for good —
-- "works while you are gone" meant "drafts while you are gone".
--
-- The first honest executor is the person. MaydaOS prepared it, they approved
-- it, they did it in the world, and they record that it is done and where it
-- went. An automatic executor — the server sending or publishing on its own —
-- arrives later as a second caller of the same function, which is why that
-- path exists below and is tested now: even the server cannot finish what
-- nobody approved.

-- Finishing.
--
-- One transaction: walk the item legally to `approved`, move it to
-- `completed`, write down what it produced, and record who did it. Every hop
-- is an ordinary UPDATE, so the existing gate judges each one — this function
-- adds no rule of its own about approval, it simply cannot get past the one
-- that is already there. A refusal anywhere rolls the whole walk back, so an
-- item is never left halfway to done.
create or replace function public.os_complete_item(
  p_item_id uuid,
  p_url text default null,
  p_note text default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  acting_user uuid := (select auth.uid());
  current_status text;
  hop text;
  link text := nullif(btrim(coalesce(p_url, '')), '');
  outcome jsonb;
begin
  -- Read under the caller's own row-level security: a row they cannot see
  -- does not exist, and says so in the same words as everywhere else.
  select status into current_status from public.os_work_items where id = p_item_id;
  if current_status is null then
    raise exception 'not your work item' using errcode = 'insufficient_privilege';
  end if;

  if current_status in ('completed', 'canceled') then
    raise exception 'work item is already %', current_status using errcode = 'check_violation';
  end if;

  if link is not null and link !~* '^https?://[^[:space:]]+$' then
    raise exception 'an outcome link must be an http or https address' using errcode = 'check_violation';
  end if;

  foreach hop in array (
    case current_status
      when 'pending' then array['drafted', 'review', 'approved']
      when 'triaged' then array['review', 'approved']
      when 'drafted' then array['review', 'approved']
      when 'review'  then array['approved']
      when 'blocked' then array['approved']
      else array[]::text[]
    end
  )
  loop
    update public.os_work_items set status = hop where id = p_item_id;
  end loop;

  outcome := jsonb_strip_nulls(jsonb_build_object(
    'kind', 'outcome',
    'url', link,
    'note', nullif(btrim(coalesce(p_note, '')), ''),
    'at', to_jsonb(now()),
    'by', acting_user
  ));

  update public.os_work_items
     set status = 'completed',
         artifacts = artifacts || jsonb_build_array(outcome)
   where id = p_item_id;

  -- A person's act goes through os_record_event, which stamps them as the
  -- actor. The server has no session, so its act is recorded with a null
  -- actor — which the record already reads as "the system did this".
  if acting_user is null then
    insert into public.os_work_item_events (item_id, actor, event, detail)
    values (p_item_id, null, 'completed', (outcome - 'kind') - 'by');
  else
    perform public.os_record_event(p_item_id, 'completed', (outcome - 'kind') - 'by');
  end if;
end;
$$;

-- Dismissing. Legal from anywhere but the end, which the transition map
-- already says; the reason is kept because "why did this go away" is the
-- question someone asks a month later.
create or replace function public.os_dismiss_item(p_item_id uuid, p_reason text default null)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  acting_user uuid := (select auth.uid());
  current_status text;
  detail jsonb;
begin
  select status into current_status from public.os_work_items where id = p_item_id;
  if current_status is null then
    raise exception 'not your work item' using errcode = 'insufficient_privilege';
  end if;

  -- The gate only judges a status that changes, so canceled-to-canceled would
  -- slip through it and append a second "dismissed" to a record whose whole
  -- value is that each line happened once.
  if current_status in ('completed', 'canceled') then
    raise exception 'work item is already %', current_status using errcode = 'check_violation';
  end if;

  update public.os_work_items set status = 'canceled' where id = p_item_id;

  detail := jsonb_strip_nulls(jsonb_build_object('reason', nullif(btrim(coalesce(p_reason, '')), '')));

  if acting_user is null then
    insert into public.os_work_item_events (item_id, actor, event, detail)
    values (p_item_id, null, 'dismissed', detail);
  else
    perform public.os_record_event(p_item_id, 'dismissed', detail);
  end if;
end;
$$;

revoke all on function public.os_complete_item(uuid, text, text) from public, anon;
revoke all on function public.os_dismiss_item(uuid, text) from public, anon;
grant execute on function public.os_complete_item(uuid, text, text) to authenticated, service_role;
grant execute on function public.os_dismiss_item(uuid, text) to authenticated, service_role;

-- What was finished lately, so it can still be opened and the co-founder
-- knows it happened. The fortnight is the database's clock, not the page's,
-- for the same reason waiting_days is: reading the time while rendering is
-- impure, and two people should agree on what "lately" means.
create or replace view public.os_finished_lately with (security_invoker = on) as
  select i.*
    from public.os_work_items i
   where i.status = 'completed'
     and i.updated_at >= now() - interval '14 days';

revoke all on public.os_finished_lately from public, anon, authenticated;
grant select on public.os_finished_lately to authenticated;

comment on function public.os_complete_item(uuid, text, text) is
  'Walks an item legally to completed in one transaction. Adds no approval rule of its own: the gate on os_work_items judges every hop, against the server too.';
