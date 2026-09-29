-- Local-only SQL equivalent of buildCompanyContext's selected-company joins.
-- Run with psql -X -v ON_ERROR_STOP=1 against supabase_db_maydalabs.
-- No fixture is committed. ON_ERROR_STOP also rolls back on disconnect.
-- -v inject_failure=1 deliberately fails after seeding to test rollback.
-- -v verify_absence_only=1 runs only the read-only absence/guard checks.
-- This proves SQL/RLS behavior, not the JavaScript-to-PostgREST transport.
\set ON_ERROR_STOP on

do $$
begin
  if exists (
    select id from auth.users where id::text like 'f81961af-7f04-4d01-%'
    union all select id from public.os_companies where id::text like 'f81961af-7f04-4d01-%'
    union all select user_id from public.os_company_members
      where user_id::text like 'f81961af-7f04-4d01-%' or company_id::text like 'f81961af-7f04-4d01-%'
    union all select id from public.os_work_items where id::text like 'f81961af-7f04-4d01-%'
    union all select id from public.os_approvals where id::text like 'f81961af-7f04-4d01-%'
    union all select id from public.os_work_item_events where id::text like 'f81961af-7f04-4d01-%'
  ) then raise exception 'proof fixture UUID collision or leftover'; end if;
  if (select count(*) from pg_trigger where tgenabled = 'O' and
      (tgrelid, tgname) in (
        ('public.os_work_item_events'::regclass, 'os_work_item_events_append_only'),
        ('public.os_company_memory'::regclass, 'os_company_memory_no_delete'),
        ('public.os_messages'::regclass, 'os_messages_append_only')
      )) <> 3 then raise exception 'an immutable guard is absent or disabled'; end if;
end;
$$;
select 'PASS: fixture UUIDs absent; all three immutable guards enabled' as preflight,
       2 as preflight_assertions;

\if :{?verify_absence_only}
  \quit
\endif

begin;
set local statement_timeout = '15s';
set local lock_timeout = '2s';

create temporary table proof_assertions (label text primary key) on commit drop;
grant select, insert on proof_assertions to authenticated, service_role;

create function pg_temp.proof_assert(ok boolean, label text) returns void
language plpgsql security invoker as $$
begin
  if ok is distinct from true then raise exception 'isolation assertion failed: %', label; end if;
  insert into pg_temp.proof_assertions values (label);
end;
$$;

-- Fixed UUID namespace is checked for collisions above; all values are synthetic.
insert into auth.users (id, email) values
  ('f81961af-7f04-4d01-a002-000000000001', 'context-proof-a@example.invalid'),
  ('f81961af-7f04-4d01-a002-000000000002', 'context-proof-outsider@example.invalid');
insert into public.os_companies (id, name) values
  ('f81961af-7f04-4d01-a001-000000000001', 'Context proof A'),
  ('f81961af-7f04-4d01-a001-000000000002', 'Context proof B'),
  ('f81961af-7f04-4d01-a001-000000000003', 'Context proof C');
insert into public.os_company_members (company_id, user_id, role) values
  ('f81961af-7f04-4d01-a001-000000000001', 'f81961af-7f04-4d01-a002-000000000001', 'owner'),
  ('f81961af-7f04-4d01-a001-000000000002', 'f81961af-7f04-4d01-a002-000000000001', 'member'),
  ('f81961af-7f04-4d01-a001-000000000003', 'f81961af-7f04-4d01-a002-000000000002', 'owner');
insert into public.os_work_items (id, company_id, lane, kind, title, status) values
  ('f81961af-7f04-4d01-a003-000000000001', 'f81961af-7f04-4d01-a001-000000000001', 'ops', 'note', 'A open title', 'drafted'),
  ('f81961af-7f04-4d01-a003-000000000002', 'f81961af-7f04-4d01-a001-000000000001', 'ops', 'note', 'A completed title', 'completed'),
  ('f81961af-7f04-4d01-a003-000000000003', 'f81961af-7f04-4d01-a001-000000000002', 'ops', 'note', 'B title', 'drafted'),
  ('f81961af-7f04-4d01-a003-000000000004', 'f81961af-7f04-4d01-a001-000000000003', 'ops', 'note', 'C title', 'drafted');

insert into public.os_approvals (id, item_id, action, notes, approved_by, approved_at)
select ('f81961af-7f04-4d01-a004-' || lpad(n::text, 12, '0'))::uuid,
       ('f81961af-7f04-4d01-a003-' || lpad((case when n <= 2 then n when n <= 14 then 3 else 4 end)::text, 12, '0'))::uuid,
       (case when n <= 2 then 'A' when n <= 14 then 'B' else 'C' end) || ' action ' || n,
       (case when n <= 2 then 'A' when n <= 14 then 'B' else 'C' end) || ' note ' || n,
       (case when n = 15 then 'f81961af-7f04-4d01-a002-000000000002'
             else 'f81961af-7f04-4d01-a002-000000000001' end)::uuid,
       timestamptz '2040-01-01 00:00:00+00' + n * interval '1 second'
from generate_series(1, 15) as n;

insert into public.os_work_item_events (id, item_id, event, detail, at)
select ('f81961af-7f04-4d01-a005-' || lpad(n::text, 12, '0'))::uuid,
       ('f81961af-7f04-4d01-a003-' || lpad((case when n <= 2 then n when n <= 22 then 3 else 4 end)::text, 12, '0'))::uuid,
       (case when n <= 2 then 'A' when n <= 22 then 'B' else 'C' end) || ' event ' || n,
       jsonb_build_object('synthetic', true),
       timestamptz '2040-01-01 00:00:00+00' + n * interval '1 second'
from generate_series(1, 23) as n;

-- Same joins, selected-company predicate, sort and limits as the fixed helper.
-- SECURITY INVOKER is essential: each caller must retain its own RLS boundary.
create function pg_temp.selected_approvals(selected_company uuid)
returns table(action text, notes text, title text, company_id uuid, item_status text)
language sql security invoker as $$
  select a.action, a.notes, i.title, i.company_id, i.status
  from public.os_approvals a inner join public.os_work_items i on i.id = a.item_id
  where i.company_id = selected_company
  order by a.approved_at desc limit 10;
$$;
create function pg_temp.selected_events(selected_company uuid)
returns table(event text, title text, company_id uuid, item_status text)
language sql security invoker as $$
  select e.event, i.title, i.company_id, i.status
  from public.os_work_item_events e inner join public.os_work_items i on i.id = e.item_id
  where i.company_id = selected_company
  order by e.at desc limit 15;
$$;

create function pg_temp.verify_ab(caller text, visible_c integer) returns void
language plpgsql security invoker as $$
declare
  company_a constant uuid := 'f81961af-7f04-4d01-a001-000000000001';
  company_b constant uuid := 'f81961af-7f04-4d01-a001-000000000002';
  company_c constant uuid := 'f81961af-7f04-4d01-a001-000000000003';
begin
  perform pg_temp.proof_assert((select count(*) = 2 from pg_temp.selected_approvals(company_a)), caller || ': A approval count');
  perform pg_temp.proof_assert((select array_agg(action order by action) = array['A action 1', 'A action 2'] from pg_temp.selected_approvals(company_a)), caller || ': A actions');
  perform pg_temp.proof_assert((select array_agg(notes order by notes) = array['A note 1', 'A note 2'] from pg_temp.selected_approvals(company_a)), caller || ': A notes');
  perform pg_temp.proof_assert((select array_agg(title order by title) = array['A completed title', 'A open title'] from pg_temp.selected_approvals(company_a)), caller || ': A approval titles');
  perform pg_temp.proof_assert((select bool_and(company_id = company_a) from pg_temp.selected_approvals(company_a)), caller || ': A approval ownership');
  perform pg_temp.proof_assert((select count(*) = 1 from pg_temp.selected_approvals(company_a) where item_status = 'completed'), caller || ': completed approval retained');
  perform pg_temp.proof_assert((select count(*) = 10 and bool_and(company_id = company_b and action like 'B action %' and notes like 'B note %' and title = 'B title') from pg_temp.selected_approvals(company_b)), caller || ': B approvals isolated and capped');
  perform pg_temp.proof_assert((select count(*) = 2 from pg_temp.selected_events(company_a)), caller || ': A event count');
  perform pg_temp.proof_assert((select array_agg(event order by event) = array['A event 1', 'A event 2'] from pg_temp.selected_events(company_a)), caller || ': A event names');
  perform pg_temp.proof_assert((select array_agg(title order by title) = array['A completed title', 'A open title'] from pg_temp.selected_events(company_a)), caller || ': A event titles');
  perform pg_temp.proof_assert((select bool_and(company_id = company_a) from pg_temp.selected_events(company_a)), caller || ': A event ownership');
  perform pg_temp.proof_assert((select count(*) = 1 from pg_temp.selected_events(company_a) where item_status = 'completed'), caller || ': completed event retained');
  perform pg_temp.proof_assert((select count(*) = 15 and bool_and(company_id = company_b and event like 'B event %' and title = 'B title') from pg_temp.selected_events(company_b)), caller || ': B events isolated and capped');
  perform pg_temp.proof_assert((select count(*) = visible_c from pg_temp.selected_approvals(company_c)), caller || ': C approval visibility');
  perform pg_temp.proof_assert((select count(*) = visible_c from pg_temp.selected_events(company_c)), caller || ': C event visibility');

  -- Original unscoped reads, restricted only to our fixtures to avoid real data.
  -- B has more newer records than both caps; A disappears without company scope.
  perform pg_temp.proof_assert((select count(*) = 10 and bool_and(action not like 'A %') from (
    select action from public.os_approvals where id::text like 'f81961af-7f04-4d01-a004-%'
    order by approved_at desc limit 10
  ) unscoped), caller || ': original approval crowdout reproduced');
  perform pg_temp.proof_assert((select count(*) = 15 and bool_and(event not like 'A %') from (
    select event from public.os_work_item_events where id::text like 'f81961af-7f04-4d01-a005-%'
    order by at desc limit 15
  ) unscoped), caller || ': original event crowdout reproduced');
end;
$$;

set local role service_role;
select pg_temp.verify_ab('admin', 1);
reset role;

set local request.jwt.claim.sub = 'f81961af-7f04-4d01-a002-000000000001';
set local role authenticated;
select pg_temp.verify_ab('member A+B', 0);
select pg_temp.proof_assert((select count(*) = 2 from public.os_companies where id::text like 'f81961af-7f04-4d01-a001-%'), 'member A+B: both memberships visible');
reset role;

set local request.jwt.claim.sub = 'f81961af-7f04-4d01-a002-000000000002';
set local role authenticated;
select pg_temp.proof_assert((select count(*) = 0 from pg_temp.selected_approvals('f81961af-7f04-4d01-a001-000000000001')), 'outsider: A approvals hidden');
select pg_temp.proof_assert((select count(*) = 0 from pg_temp.selected_approvals('f81961af-7f04-4d01-a001-000000000002')), 'outsider: B approvals hidden');
select pg_temp.proof_assert((select count(*) = 0 from pg_temp.selected_events('f81961af-7f04-4d01-a001-000000000001')), 'outsider: A events hidden');
select pg_temp.proof_assert((select count(*) = 0 from pg_temp.selected_events('f81961af-7f04-4d01-a001-000000000002')), 'outsider: B events hidden');
select pg_temp.proof_assert((select count(*) = 1 from pg_temp.selected_approvals('f81961af-7f04-4d01-a001-000000000003') where action = 'C action 15' and notes = 'C note 15' and title = 'C title'), 'outsider: own C approval retained');
select pg_temp.proof_assert((select count(*) = 1 from pg_temp.selected_events('f81961af-7f04-4d01-a001-000000000003') where event = 'C event 23' and title = 'C title'), 'outsider: own C event retained');
reset role;

select 'PASS: selected-company SQL/RLS proof' as result,
       count(*) as transaction_assertions from pg_temp.proof_assertions;

\if :{?inject_failure}
  -- Intentional failure: psql disconnect must roll back every synthetic row.
  select 1 / 0 as intentional_rollback_probe;
\endif

rollback;

do $$
begin
  if exists (
    select id from auth.users where id::text like 'f81961af-7f04-4d01-%'
    union all select id from public.os_companies where id::text like 'f81961af-7f04-4d01-%'
    union all select user_id from public.os_company_members
      where user_id::text like 'f81961af-7f04-4d01-%' or company_id::text like 'f81961af-7f04-4d01-%'
    union all select id from public.os_work_items where id::text like 'f81961af-7f04-4d01-%'
    union all select id from public.os_approvals where id::text like 'f81961af-7f04-4d01-%'
    union all select id from public.os_work_item_events where id::text like 'f81961af-7f04-4d01-%'
  ) then raise exception 'proof fixtures survived rollback'; end if;
  if (select count(*) from pg_trigger where tgenabled = 'O' and
      (tgrelid, tgname) in (
        ('public.os_work_item_events'::regclass, 'os_work_item_events_append_only'),
        ('public.os_company_memory'::regclass, 'os_company_memory_no_delete'),
        ('public.os_messages'::regclass, 'os_messages_append_only')
      )) <> 3 then raise exception 'an immutable guard changed'; end if;
end;
$$;
select 'PASS: zero fixture UUIDs after ROLLBACK; immutable guards preserved' as cleanup,
       2 as cleanup_assertions;
