-- Starting a company, and recording what happened to its work.
--
-- The spine gave a company work items, approvals and a history, but nothing
-- that lets a person begin: a company and its first member had to be inserted
-- by hand. A product whose first step is "ask us to create your row" has no
-- first step.

-- A person may start a company. The trigger below makes them its owner in the
-- same statement, so there is no window where a company exists with nobody
-- able to see it.
grant insert on table public.os_companies to authenticated;

create policy "os_companies_start" on public.os_companies
  for insert to authenticated with check (true);

create or replace function internal.os_company_first_member()
returns trigger
language plpgsql
security definer
set search_path = public, internal
as $$
declare
  acting_user uuid := (select auth.uid());
  owned integer;
begin
  -- Trusted server code creates companies without a session; it names the
  -- owner itself.
  if acting_user is null then
    return new;
  end if;

  select count(*) into owned
    from public.os_company_members m
   where m.user_id = acting_user and m.role = 'owner';

  if owned >= 3 then
    raise exception 'company limit reached: three per person'
      using errcode = 'check_violation';
  end if;

  insert into public.os_company_members (company_id, user_id, role)
  values (new.id, acting_user, 'owner');

  return new;
end;
$$;

create trigger os_companies_first_member
  after insert on public.os_companies
  for each row execute function internal.os_company_first_member();

-- Appending to the record.
--
-- The history is append-only and nobody holds an insert grant on it, because
-- an event a caller can shape freely is not evidence. This is the only way in:
-- it checks membership, stamps the actor itself, and cannot be pointed at
-- another company's item.
create or replace function public.os_record_event(p_item_id uuid, p_event text, p_detail jsonb default '{}'::jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user uuid := (select auth.uid());
  new_id uuid;
begin
  if not exists (
    select 1
      from public.os_work_items i
      join public.os_company_members m on m.company_id = i.company_id
     where i.id = p_item_id and m.user_id = acting_user
  ) then
    raise exception 'not your work item' using errcode = 'insufficient_privilege';
  end if;

  insert into public.os_work_item_events (item_id, actor, event, detail)
  values (p_item_id, acting_user, p_event, coalesce(p_detail, '{}'::jsonb))
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.os_record_event(uuid, text, jsonb) from public, anon;
grant execute on function public.os_record_event(uuid, text, jsonb) to authenticated;

-- How long something has waited belongs to the database, not the page.
-- Reading the clock while rendering is impure, and two readers should agree
-- on how old a decision is regardless of when their browser painted.
create or replace view public.os_needs_you with (security_invoker = on) as
  select
    i.id,
    i.company_id,
    i.lane,
    i.kind,
    i.title,
    i.status,
    i.required_action,
    i.updated_at,
    case
      when i.status = 'blocked' then 'blocked'
      when i.status = 'review' then 'decide'
      when i.status = 'approved' and i.required_action is not null then 'finish'
      else 'other'
    end as route,
    (now() - i.updated_at) as waiting_for,
    (extract(epoch from (now() - i.updated_at)) / 86400)::integer as waiting_days
  from public.os_work_items i
  where i.status in ('review', 'approved', 'blocked');

revoke all on public.os_needs_you from public, anon, authenticated;
grant select on public.os_needs_you to authenticated;
