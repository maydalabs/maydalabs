-- Isolated, fictional SQL proof. Refuses every database except a named
-- maydaos_review_quality_<suffix> clone. Everything below rolls back.
-- Requires existing company/Work schema, plus review migrations (or pass them
-- as review_migration and review_mode_migration). Pass quality_migration as
-- the absolute path to the new quality migration: it is applied IN this proof
-- transaction, after legacy fixtures are prepared. No model or external calls.
\set ON_ERROR_STOP on
do $$ begin
  if current_database() !~ '^maydaos_review_quality_[a-z0-9_]+$' then
    raise exception 'refusing quality proof outside named disposable database';
  end if;
  if exists(select 1 from auth.users where id::text like 'f81961af-922d-4d03-%')
     or exists(select 1 from public.os_companies where id::text like 'f81961af-922d-4d03-%') then
    raise exception 'quality proof UUID collision';
  end if;
end; $$;
\if :{?quality_migration}
\else
  \echo 'quality_migration path is required; nothing changed'
  \quit 1
\endif
begin;
set local statement_timeout='15s';
set local lock_timeout='2s';
\if :{?review_migration}
  \i :review_migration
\endif
\if :{?review_mode_migration}
  \i :review_mode_migration
\endif

create temporary table quality_assertions(label text primary key) on commit drop;
create temporary table quality_legacy(label text primary key, proposal jsonb) on commit drop;
grant select,insert on quality_assertions,quality_legacy to service_role;
create function pg_temp.quality_assert(ok boolean,label text) returns void
language plpgsql security invoker as $$ begin
  if ok is distinct from true then raise exception 'quality proof failed: %',label; end if;
  insert into pg_temp.quality_assertions values(label);
end; $$;
create function pg_temp.quality_rejected(command text, expected text, label text) returns void
language plpgsql security invoker as $$
declare refused boolean:=false; found_code text; found_message text;
begin
  begin
    execute command;
  exception when others then
    get stacked diagnostics found_code=returned_sqlstate, found_message=message_text;
    if found_code <> 'P0001' or found_message <> expected then raise; end if;
    refused:=true;
  end;
  perform pg_temp.quality_assert(refused,label);
end; $$;
create function pg_temp.quality_stage(company uuid, actor uuid, body text, kind text, action text, title text default 'Fictional draft')
returns jsonb language plpgsql security invoker as $$
declare started jsonb; payload jsonb;
begin
  started:=public.os_review_begin(gen_random_uuid(),company,actor,'Prepare new work from fixture text.','draft');
  payload:=jsonb_build_object('type','work','title',title,'body',body,'lane','internal','kind',kind,'outwardAction',action,
    'citations',jsonb_build_array(jsonb_build_object('sourceId',started#>>'{turn,person_message_id}','quote','fixture text')));
  return public.os_review_propose(gen_random_uuid(),(started#>>'{turn,id}')::uuid,company,actor,payload);
end; $$;
create function pg_temp.quality_save(p jsonb) returns jsonb language sql security invoker as $$
  select public.os_review_decide((p->>'id')::uuid,(p->>'company_id')::uuid,(p->>'actor_id')::uuid,
    (p->>'revision')::integer,p->>'fingerprint','save_to_work');
$$;

insert into auth.users(id,email) values
 ('f81961af-922d-4d03-a002-000000000001','quality-a@example.invalid'),
 ('f81961af-922d-4d03-a002-000000000002','quality-b@example.invalid'),
 ('f81961af-922d-4d03-a002-000000000003','quality-second-member@example.invalid');
insert into public.os_companies(id,name) values
 ('f81961af-922d-4d03-a001-000000000001','Fictional quality company A'),
 ('f81961af-922d-4d03-a001-000000000002','Fictional quality company B');
insert into public.os_company_members(company_id,user_id,role) values
 ('f81961af-922d-4d03-a001-000000000001','f81961af-922d-4d03-a002-000000000001','owner'),
 ('f81961af-922d-4d03-a001-000000000001','f81961af-922d-4d03-a002-000000000003','member'),
 ('f81961af-922d-4d03-a001-000000000002','f81961af-922d-4d03-a002-000000000002','owner');
insert into internal.os_beta_members(user_id) values
 ('f81961af-922d-4d03-a002-000000000001'),('f81961af-922d-4d03-a002-000000000002'),('f81961af-922d-4d03-a002-000000000003');
set local role service_role;
insert into quality_legacy values
 ('unsaved',pg_temp.quality_stage('f81961af-922d-4d03-a001-000000000001','f81961af-922d-4d03-a002-000000000001','Legacy unsaved memo.','memo',null)),
 ('saved',pg_temp.quality_save(pg_temp.quality_stage('f81961af-922d-4d03-a001-000000000001','f81961af-922d-4d03-a002-000000000001','Legacy saved memo.','memo',null)));
reset role;
\i :quality_migration

set local role service_role;
do $$
<<proof>>
declare
 company constant uuid:='f81961af-922d-4d03-a001-000000000001';
 actor constant uuid:='f81961af-922d-4d03-a002-000000000001';
 company_b constant uuid:='f81961af-922d-4d03-a001-000000000002';
 actor_b constant uuid:='f81961af-922d-4d03-a002-000000000002';
 member_b constant uuid:='f81961af-922d-4d03-a002-000000000003';
 p jsonb; second jsonb; saved jsonb; prior jsonb; bad jsonb; payload jsonb;
 kind text; action text; state text; fixture_id uuid; count_before integer;
begin
 -- New actions have a finite coherent vocabulary; historical DTO reads/replays
 -- retain their exact original data. No input is silently normalized.
 foreach kind in array array['email','reply','post','note','research','decision'] loop
   action:=case kind when 'email' then 'send' when 'reply' then 'send' when 'post' then 'publish' else null end;
   p:=pg_temp.quality_stage(company,actor,'Valid '||kind||' body.',kind,action);
   saved:=pg_temp.quality_save(p);
   perform pg_temp.quality_assert(saved->>'status'='saved','valid pair saves: '||kind);
 end loop;
 foreach kind in array array['email','reply','post'] loop
   perform pg_temp.quality_rejected(format('select pg_temp.quality_stage(%L,%L,%L,%L,null)',company,actor,'Missing action '||kind,kind),
     'review_work_action_mismatch','missing outward action refused: '||kind);
 end loop;
 foreach kind in array array['note','research','decision'] loop
   perform pg_temp.quality_rejected(format('select pg_temp.quality_stage(%L,%L,%L,%L,%L)',company,actor,'Unexpected action '||kind,kind,'send'),
     'review_work_action_mismatch','internal outward action refused: '||kind);
 end loop;
 perform pg_temp.quality_rejected(format('select pg_temp.quality_stage(%L,%L,%L,%L,null)',company,actor,'New unknown kind.','memo'),
   'review_work_action_mismatch','new unknown kind refused');
 perform pg_temp.quality_rejected(format('select pg_temp.quality_stage(%L,%L,%L,%L,%L)',company,actor,'Spaced action.','reply','  SeNd  '),
   'review_work_action_mismatch','action text is exact and never normalized');
 select proposal into p from quality_legacy where label='unsaved';
 perform pg_temp.quality_rejected(format('select pg_temp.quality_save(%L::jsonb)',p),'review_work_action_mismatch','old invalid unsaved proposal cannot bypass save guard');
 perform pg_temp.quality_assert((select status='proposed' and record_id is null from public.os_review_proposals where id=(p->>'id')::uuid),
   'failed old-draft save leaves proposal unsaved');
 select proposal into p from quality_legacy where label='saved';
 perform pg_temp.quality_assert(pg_temp.quality_save(p)=p,'historical saved receipt replays unchanged');

 -- Each current state counts as open, even if the new title/labels differ.
 foreach state in array array['pending','triaged','drafted','review','approved','blocked'] loop
   insert into public.os_work_items(company_id,lane,kind,title,status,notes)
     values(company,'different','manual','Existing '||state,state,'Open body for '||state) returning id into fixture_id;
   select count(*) into count_before from public.os_review_proposals where company_id=company;
   perform pg_temp.quality_rejected(format('select pg_temp.quality_stage(%L,%L,%L,%L,null,%L)',company,actor,'Open body for '||state,'note','Completely changed title'),
     'review_duplicate_work','literal duplicate refused at stage: '||state);
   perform pg_temp.quality_assert((select count(*)=count_before from public.os_review_proposals where company_id=company),
     'failed duplicate stage creates no proposal: '||state);
 end loop;
 p:=pg_temp.quality_stage(company_b,actor_b,'Open body for review','note',null);
 perform pg_temp.quality_assert(p->>'status'='proposed','other-company identical text is independent');
 foreach state in array array['completed','canceled'] loop
   insert into public.os_work_items(company_id,lane,kind,title,status,notes)
     values(company,'internal','manual','Closed '||state,state,'Closed body for '||state);
   p:=pg_temp.quality_stage(company,actor,'Closed body for '||state,'note',null);
   perform pg_temp.quality_assert(p->>'status'='proposed','closed body does not block new proposal: '||state);
 end loop;
 p:=pg_temp.quality_stage(company,actor,'Open body for review ','note',null);
 perform pg_temp.quality_assert(p->>'status'='proposed','different literal bytes are not fuzzily merged');

 -- An already staged card can become a duplicate before Save is clicked.
 -- The insert fails inside os_review_decide: no Work/event/receipt is added.
 p:=pg_temp.quality_stage(company,actor,'Race body.','note',null,'First title');
 second:=pg_temp.quality_stage(company,member_b,'Race body.','note',null,'Other actor and title');
 saved:=pg_temp.quality_save(p);
 select count(*) into count_before from public.os_work_items where company_id=company;
 perform pg_temp.quality_rejected(format('select pg_temp.quality_save(%L::jsonb)',second),'review_duplicate_work','different actor and turn cannot save same open body');
 perform pg_temp.quality_assert((select count(*)=count_before from public.os_work_items where company_id=company),'rejected save adds no Work');
 perform pg_temp.quality_assert((select count(*)=1 from public.os_work_item_events where item_id=(saved->>'record_id')::uuid),'rejected save adds no second Work event');
 perform pg_temp.quality_assert((select status='proposed' and record_id is null from public.os_review_proposals where id=(second->>'id')::uuid),'rejected save preserves unsaved proposal');
 perform pg_temp.quality_assert(pg_temp.quality_save(p)=saved,'original successful save remains idempotent');
 prior:=public.os_review_propose(gen_random_uuid(),(p->>'turn_id')::uuid,company,actor,p->'payload');
 perform pg_temp.quality_assert(prior=saved,'same-turn same-content staging replay precedes duplicate guard');
 prior:=public.os_review_propose((p->>'id')::uuid,(p->>'turn_id')::uuid,company,actor,p->'payload');
 perform pg_temp.quality_assert(prior=saved,'same-ID staging replay precedes duplicate guard');

 -- Explicit edit checks the changed content. Refusal rolls back revision and
 -- leaves review history untouched; changing only the title cannot evade it.
 p:=pg_temp.quality_stage(company,actor,'Unique revision body.','note',null);
 payload:=jsonb_set(p->'payload','{body}',to_jsonb('Race body.'::text));
 perform pg_temp.quality_rejected(format('select public.os_review_decide(%L,%L,%L,1,%L,%L,%L::jsonb)',p->>'id',company,actor,p->>'fingerprint','revise',payload),
   'review_duplicate_work','edit into existing body refused');
 payload:=jsonb_set(p->'payload','{kind}',to_jsonb('email'::text));
 perform pg_temp.quality_rejected(format('select public.os_review_decide(%L,%L,%L,1,%L,%L,%L::jsonb)',p->>'id',company,actor,p->>'fingerprint','revise',payload),
   'review_work_action_mismatch','edit into incoherent pair refused');
 perform pg_temp.quality_assert((select revision=1 and row.payload=proof.p->'payload' from public.os_review_proposals row where id=(proof.p->>'id')::uuid),'refused edit preserves revision');
 perform pg_temp.quality_assert((select count(*)=1 from public.os_review_proposal_revisions where proposal_id=(p->>'id')::uuid),'refused edit creates no revision history');
 perform pg_temp.quality_assert((select count(*)=0 from public.os_approvals a join public.os_work_items i on i.id=a.item_id where i.company_id in(company,company_b)),
   'guards never approve or execute work');
end; $$;
reset role;

-- New functions stay internal, invoker-only and service-only; no table grant
-- was added. Existing RLS / explicit actor membership checks remain in RPCs.
select pg_temp.quality_assert(not has_function_privilege('anon','internal.os_review_check_new_work(uuid,text,text,text)','execute'), 'anonymous cannot execute guard');
select pg_temp.quality_assert(not has_function_privilege('authenticated','internal.os_review_check_new_work(uuid,text,text,text)','execute'), 'browser cannot execute guard');
select pg_temp.quality_assert(has_function_privilege('service_role','internal.os_review_check_new_work(uuid,text,text,text)','execute'), 'service role can execute guard');
select pg_temp.quality_assert((select count(*)=3 and bool_and(not prosecdef) from pg_proc where oid in
 ('internal.os_review_check_new_work(uuid,text,text,text)'::regprocedure,
  'internal.os_review_proposal_work_quality()'::regprocedure,'internal.os_review_saved_work_quality()'::regprocedure)), 'all new guards are security invoker');
select count(*) as quality_assertions_passed from quality_assertions;
rollback;
