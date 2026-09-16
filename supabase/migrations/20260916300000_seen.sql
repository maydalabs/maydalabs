-- What happened while you were away.
--
-- MaydaOS can now do things without you — the worker drafts, the co-founder
-- files and learns — and until this there was no difference between something
-- that happened a minute ago and something that happened last week. A system
-- that acts on its own and cannot tell you what it did since you last looked
-- is a system you have to audit rather than one you can trust.
--
-- This lives on os_desktops because it is the same kind of fact: a property
-- of a person's own view, not of the company.

alter table public.os_desktops
  add column seen_at timestamptz not null default now();

comment on column public.os_desktops.seen_at is
  'When this person last looked at the desk. Everything in the record after it is new to them.';

-- The grant that made os_mark_seen ceremony.
--
-- os_desktops was granted table-level UPDATE so a person could save their own
-- window layout, which also let them write seen_at directly — including
-- backwards. A definer function guarding a column anyone can set is theatre,
-- and a test asserting it cannot be backdated would have gone on passing for
-- the wrong reason if it had checked anything less specific.
--
-- Postgres checks column grants before policies, so narrowing the grant is
-- the whole fix. user_id stays writable because the upsert that saves a
-- layout names it, and the policy pins it to auth.uid() on the way in and the
-- way out, so it cannot be used to reach another person's desk.
revoke update on table public.os_desktops from authenticated;
grant update (layout, user_id) on table public.os_desktops to authenticated;

-- Marking it read.
--
-- A function rather than an update grant, so this is the only column a
-- browser can move and it can only ever move it to now(). "I looked at this"
-- is not a claim worth letting anyone backdate.
create or replace function public.os_mark_seen()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user uuid := (select auth.uid());
  marked timestamptz;
begin
  if acting_user is null then
    raise exception 'not signed in' using errcode = 'insufficient_privilege';
  end if;

  insert into public.os_desktops (user_id, seen_at)
  values (acting_user, now())
  on conflict (user_id) do update set seen_at = now()
  returning seen_at into marked;

  return marked;
end;
$$;

revoke all on function public.os_mark_seen() from public, anon;
grant execute on function public.os_mark_seen() to authenticated;

-- What is new to you, and what it was.
--
-- security_invoker, so a person sees exactly the events their membership
-- already lets them see. The joins are here rather than in the page because
-- "who did this" is the column that makes the record worth keeping, and it
-- should not be optional to select it.
create or replace view public.os_recent_record with (security_invoker = on) as
  select
    e.id,
    i.company_id,
    e.item_id,
    i.title,
    i.lane,
    i.kind,
    i.status,
    e.event,
    e.detail,
    e.actor,
    -- The distinction the whole product rests on: a person did this, or the
    -- system did. Null actor is not missing data, it is the answer.
    (e.actor is not null) as by_a_person,
    e.at
  from public.os_work_item_events e
  join public.os_work_items i on i.id = e.item_id;

revoke all on public.os_recent_record from public, anon, authenticated;
grant select on public.os_recent_record to authenticated;

comment on view public.os_recent_record is
  'The history with its work item attached, and whether a person or the system did each thing.';
