-- The gate watched the door but not the window.
--
-- internal.os_work_item_gate() only ever fired on UPDATE, so every check it
-- performs could be skipped by creating the item in its final state instead
-- of moving it there. A company member could insert a work item already at
-- `approved`, carrying a required_action nobody had approved, and the
-- database would agree it was approved.
--
-- That is the one promise MaydaOS makes: the system may prepare anything and
-- may decide nothing. Anything downstream that reads `approved` as "a person
-- signed off" — the worker that acts outward, above all — would have been
-- acting on a forgery.
--
-- The fix is the same condition, applied on the way in as well. Note that it
-- is self-enforcing rather than merely strict: os_approvals.item_id is a
-- foreign key to os_work_items, so an approval cannot exist before the item
-- it approves. An item carrying a required_action therefore can never be
-- legitimately born approved, and this check says exactly that without
-- needing a separate list of forbidden birth states.
--
-- `completed` is included because it means the outward action was already
-- taken, which implies the approval just as strongly.

create or replace function internal.os_work_item_gate()
returns trigger
language plpgsql
security invoker
set search_path = public, internal
as $$
begin
  if tg_op = 'INSERT' then
    if new.status in ('approved', 'completed')
       and new.required_action is not null
       and not public.os_action_approved(new.id, new.required_action) then
      raise exception 'work item needs an approved "%" before it can be approved', new.required_action
        using errcode = 'check_violation';
    end if;

    return new;
  end if;

  if new.status is distinct from old.status then
    if not internal.os_status_can_move(old.status, new.status) then
      raise exception 'work item cannot move from % to %', old.status, new.status
        using errcode = 'check_violation';
    end if;

    if new.status = 'approved'
       and new.required_action is not null
       and not public.os_action_approved(new.id, new.required_action) then
      raise exception 'work item needs an approved "%" before it can be approved', new.required_action
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists os_work_items_gate on public.os_work_items;

create trigger os_work_items_gate
  before insert or update on public.os_work_items
  for each row execute function internal.os_work_item_gate();

comment on function internal.os_work_item_gate() is
  'An item may not enter or reach `approved` without an approval for the exact action it waits on, whichever door it comes through.';
