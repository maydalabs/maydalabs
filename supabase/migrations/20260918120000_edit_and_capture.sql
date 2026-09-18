-- Editing work, and the line past which it cannot be edited.
--
-- Until now a work item could not be edited from the desk at all — and could
-- be edited without limit through the API, because a company member holds
-- UPDATE on the table and nothing looked at which columns changed. So a draft
-- could be approved for "send" and then rewritten, or have its action changed
-- to "publish", and the approval would stand for the new text. The approval is
-- bound to an action; it has to be bound to the words as well.
--
-- Two triggers. The first freezes an item's content once it is approved,
-- finished, or carries an approval for the action it waits on — the last
-- clause so that moving an approved item back to review, editing it, and
-- re-approving cannot reuse the old signature. The second writes an `edited`
-- event with what changed and what it said before, so the record keeps the
-- edit the way it keeps everything else. Neither cares who is asking: the
-- server is refused the same way a browser is.

alter table public.os_work_items
  add column if not exists due_on date;

comment on column public.os_work_items.due_on is
  'When a person wants this done by. Optional, and theirs to change until the item is approved.';

-- The content of a work item: what a person or the co-founder wrote, and what
-- the item waits on. Status, artifacts and metadata are not content — the
-- executor appends outcomes to artifacts after approval, and must.

create or replace function internal.os_work_item_freeze()
returns trigger
language plpgsql
security invoker
set search_path = public, internal
as $$
declare
  changed boolean;
begin
  changed :=
       new.title is distinct from old.title
    or new.notes is distinct from old.notes
    or new.lane is distinct from old.lane
    or new.kind is distinct from old.kind
    or new.required_action is distinct from old.required_action
    or new.sources is distinct from old.sources
    or new.due_on is distinct from old.due_on;

  if not changed then
    return new;
  end if;

  if old.status in ('completed', 'canceled') then
    raise exception 'finished work is frozen' using errcode = 'check_violation';
  end if;

  if old.status = 'approved'
     or (old.required_action is not null and public.os_action_approved(old.id, old.required_action)) then
    raise exception 'approved work is frozen: what was approved is what stays' using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists os_work_items_freeze on public.os_work_items;

create trigger os_work_items_freeze
  before update on public.os_work_items
  for each row execute function internal.os_work_item_freeze();

comment on function internal.os_work_item_freeze() is
  'Content is editable until the item is approved, finished, or carries an approval for its action. Then what was approved is what stays.';

-- The record of an edit. Definer, because the record is written by the
-- database on the person''s behalf and nobody holds an insert grant on it —
-- the same reason os_record_event is. Who edited is read from the session,
-- and is null when the server did it, which the record then says.

create or replace function internal.os_work_item_edited()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fields text[] := '{}';
  before jsonb := '{}'::jsonb;
begin
  if new.title is distinct from old.title then
    fields := array_append(fields, 'title'); before := before || jsonb_build_object('title', old.title);
  end if;
  if new.notes is distinct from old.notes then
    fields := array_append(fields, 'notes'); before := before || jsonb_build_object('notes', old.notes);
  end if;
  if new.lane is distinct from old.lane then
    fields := array_append(fields, 'lane'); before := before || jsonb_build_object('lane', old.lane);
  end if;
  if new.kind is distinct from old.kind then
    fields := array_append(fields, 'kind'); before := before || jsonb_build_object('kind', old.kind);
  end if;
  if new.required_action is distinct from old.required_action then
    fields := array_append(fields, 'required_action'); before := before || jsonb_build_object('required_action', old.required_action);
  end if;
  if new.due_on is distinct from old.due_on then
    fields := array_append(fields, 'due_on'); before := before || jsonb_build_object('due_on', old.due_on);
  end if;
  if new.sources is distinct from old.sources then
    fields := array_append(fields, 'sources'); before := before || jsonb_build_object('sources', old.sources);
  end if;

  if array_length(fields, 1) is null then
    return null;
  end if;

  insert into public.os_work_item_events (item_id, actor, event, detail)
  values (new.id, (select auth.uid()), 'edited', jsonb_build_object('fields', to_jsonb(fields), 'before', before));

  return null;
end;
$$;

revoke all on function internal.os_work_item_edited() from public, anon, authenticated;

drop trigger if exists os_work_items_edited on public.os_work_items;

create trigger os_work_items_edited
  after update on public.os_work_items
  for each row execute function internal.os_work_item_edited();

comment on function internal.os_work_item_edited() is
  'Every change to a work item''s content becomes an `edited` event carrying the fields that changed and what they said before.';

-- Open work, with how far off its due date is by the database's clock. The
-- desk reads this instead of filtering the table itself, for the same reason
-- waiting_days exists: reading the clock while rendering is impure, and two
-- people should agree on what is overdue.

create or replace view public.os_work_open with (security_invoker = on) as
  select
    i.*,
    (i.due_on - current_date) as due_in_days
  from public.os_work_items i
  where i.status not in ('completed', 'canceled');

revoke all on public.os_work_open from public, anon, authenticated;
grant select on public.os_work_open to authenticated;

-- `select i.*` was expanded when the view was created, so the finished view
-- does not know the new column until it is created again.
create or replace view public.os_finished_lately with (security_invoker = on) as
  select i.*
    from public.os_work_items i
   where i.status = 'completed'
     and i.updated_at >= now() - interval '14 days';

revoke all on public.os_finished_lately from public, anon, authenticated;
grant select on public.os_finished_lately to authenticated;
