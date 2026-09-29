-- Local-only synthetic transaction proof. No fixtures or migration are kept.
-- psql -X -v ON_ERROR_STOP=1 -v review_migration=/absolute/path/to/base-migration.sql
--      -v review_mode_migration=/absolute/path/to/mode-migration.sql
--      -f tests/sql/os-review-durable.sql
-- Optional -v inject_failure=1 proves disconnect rollback. No remote execution.
-- This checks SQL/RLS semantics, not browser transport or concurrent sessions.
\set ON_ERROR_STOP on
do $$ begin
  if exists(select 1 from auth.users where id::text like 'f81961af-922d-4d01-%')
     or exists(select 1 from public.os_companies where id::text like 'f81961af-922d-4d01-%') then
    raise exception 'review proof UUID collision';
  end if;
end; $$;
begin;
set local statement_timeout='15s';
set local lock_timeout='2s';
\if :{?review_migration}
  \i :review_migration
\endif
\if :{?review_mode_migration}
  \i :review_mode_migration
\endif

create temporary table review_assertions(label text primary key) on commit drop;
grant select,insert on review_assertions to service_role,authenticated,anon;
create function pg_temp.review_assert(ok boolean,label text) returns void
language plpgsql security invoker as $$ begin
  if ok is distinct from true then raise exception 'review proof assertion failed: %',label; end if;
  insert into pg_temp.review_assertions values(label);
end; $$;
create function pg_temp.review_denied(sql_command text,label text) returns void
language plpgsql security invoker as $$ declare refused boolean:=false; begin
  begin execute sql_command; exception when insufficient_privilege or check_violation then refused:=true; end;
  perform pg_temp.review_assert(refused,label);
end; $$;

insert into auth.users(id,email) values
 ('f81961af-922d-4d01-a002-000000000001','review-owner@example.invalid'),
 ('f81961af-922d-4d01-a002-000000000002','review-second@example.invalid'),
 ('f81961af-922d-4d01-a002-000000000003','review-outsider@example.invalid'),
 ('f81961af-922d-4d01-a002-000000000004','review-not-beta@example.invalid');
insert into public.os_companies(id,name) values
 ('f81961af-922d-4d01-a001-000000000001','Review proof company A'),
 ('f81961af-922d-4d01-a001-000000000002','Review proof company B');
insert into public.os_company_members(company_id,user_id,role) values
 ('f81961af-922d-4d01-a001-000000000001','f81961af-922d-4d01-a002-000000000001','owner'),
 ('f81961af-922d-4d01-a001-000000000001','f81961af-922d-4d01-a002-000000000002','member'),
 ('f81961af-922d-4d01-a001-000000000002','f81961af-922d-4d01-a002-000000000003','owner'),
 ('f81961af-922d-4d01-a001-000000000001','f81961af-922d-4d01-a002-000000000004','member');
insert into internal.os_beta_members(user_id) values
 ('f81961af-922d-4d01-a002-000000000001'),('f81961af-922d-4d01-a002-000000000002'),('f81961af-922d-4d01-a002-000000000003');

set local role service_role;
do $$
<<proof>>
declare
 company constant uuid:='f81961af-922d-4d01-a001-000000000001';
 actor constant uuid:='f81961af-922d-4d01-a002-000000000001';
 turn_id constant uuid:='f81961af-922d-4d01-a003-000000000001';
 question constant text:='Draft a reply to Mara: the quote is 500 units. Our general rule is payment in advance.';
 started jsonb; retried jsonb; p jsonb; edited jsonb; memory jsonb; payload jsonb; second jsonb; known_count integer; refused boolean;
begin
 started:=public.os_review_begin(turn_id,company,actor,question,'both');
 perform pg_temp.review_assert((started->>'created')::boolean,'begin creates turn');
 perform pg_temp.review_assert(started#>>'{turn,request_mode}'='both','selected mode persisted with question');
 perform pg_temp.review_assert(started#>'{turn,history}'='[]'::jsonb,'first turn captures empty prior history');
 retried:=public.os_review_begin(turn_id,company,actor,question,'both');
 perform pg_temp.review_assert(retried->>'created'='false' and retried->'turn'=started->'turn','begin retry reuses exact durable turn');
 perform pg_temp.review_assert((select count(*)=1 from public.os_messages where thread_id=(started#>>'{turn,thread_id}')::uuid),'begin retry writes one founder message');
 perform pg_temp.review_denied(format('select public.os_review_begin(%L,%L,%L,%L,%L)',turn_id,company,actor,'Different question','both'),'same request different input rejected');
 perform pg_temp.review_denied(format('select public.os_review_begin(%L,%L,%L,%L,%L)',turn_id,company,actor,question,'ask'),'same request different mode rejected');
 perform pg_temp.review_denied(format('select public.os_review_begin(%L,%L,%L,%L,%L)',gen_random_uuid(),company,'f81961af-922d-4d01-a002-000000000003',question,'both'),'outsider membership rejected');
 perform pg_temp.review_denied(format('select public.os_review_begin(%L,%L,%L,%L,%L)',gen_random_uuid(),company,'f81961af-922d-4d01-a002-000000000004',question,'both'),'non-beta member rejected');
 payload:=jsonb_build_object('type','work','title','Reply to Mara','body','Hello Mara, the quote is 500 units.','lane','sales','kind','reply','outwardAction','send',
  'citations',jsonb_build_array(jsonb_build_object('sourceId',started#>>'{turn,person_message_id}','quote','the quote is 500 units')));
 p:=public.os_review_propose('f81961af-922d-4d01-a004-000000000001',turn_id,company,actor,payload);
 perform pg_temp.review_assert(p->>'status'='proposed' and p->'record_id'='null'::jsonb,'proposal is not work');
 perform pg_temp.review_assert((select count(*)=0 from public.os_work_items where company_id=company),'proposing does not write work');
 perform pg_temp.review_assert(p#>>'{sources,0,text}'=question and p#>>'{sources,0,origin}'='founder','source captured from immutable founder message');
 retried:=public.os_review_propose(gen_random_uuid(),turn_id,company,actor,payload);
 perform pg_temp.review_assert(retried=p,'same content with new proposal id deduplicates');
 perform pg_temp.review_denied(format('select public.os_review_propose(%L,%L,%L,%L,%L::jsonb)',gen_random_uuid(),turn_id,company,actor,payload||'{"approved":true}'::jsonb),'model approval property rejected');
 perform pg_temp.review_denied(format('select public.os_review_propose(%L,%L,%L,%L,%L::jsonb)',gen_random_uuid(),turn_id,company,actor,jsonb_set(payload,'{citations,0,quote}','"invented quote"')),'invented source excerpt rejected');
 perform pg_temp.review_denied(format('select public.os_review_propose(%L,%L,%L,%L,%L::jsonb)',gen_random_uuid(),turn_id,company,actor,jsonb_set(payload,'{citations,0,sourceId}','"some-other-message"')),'other source identity rejected');
 perform pg_temp.review_denied(format('select public.os_review_decide(%L,%L,%L,%s,%L,%L)',p->>'id',company,'f81961af-922d-4d01-a002-000000000002',p->>'revision',p->>'fingerprint','save_to_work'),'second member cannot confirm original actor draft');
 perform pg_temp.review_denied(format('select public.os_review_decide(%L,%L,%L,%s,%L,%L)',p->>'id','f81961af-922d-4d01-a001-000000000002',actor,p->>'revision',p->>'fingerprint','save_to_work'),'wrong company rejected');
 perform pg_temp.review_denied(format('select public.os_review_decide(%L,%L,%L,%s,%L,%L)',p->>'id',company,actor,p->>'revision',p->>'fingerprint','add_to_company_knowledge'),'save action must match draft type');
 edited:=public.os_review_decide((p->>'id')::uuid,company,actor,1,p->>'fingerprint','revise',jsonb_set(payload,'{body}','"Hello Mara, your quote is 500 units. Thank you."'));
 perform pg_temp.review_assert(edited->>'revision'='2' and edited->>'last_edited_by'=actor::text and edited->>'fingerprint'<>p->>'fingerprint','edit creates new review revision');
 perform pg_temp.review_assert((select count(*)=2 from public.os_review_proposal_revisions where proposal_id=(p->>'id')::uuid),'edit keeps both exact revisions');
 perform pg_temp.review_denied(format('select public.os_review_decide(%L,%L,%L,%s,%L,%L)',p->>'id',company,actor,p->>'revision',p->>'fingerprint','save_to_work'),'stale review cannot save');
 -- A database abort after all save writes must roll back the item, event and
 -- receipt together; retry sees a proposed row, not a half-saved record.
 refused:=false;
 begin
  perform public.os_review_decide((edited->>'id')::uuid,company,actor,2,edited->>'fingerprint','save_to_work');
  raise exception 'synthetic interruption' using errcode='P0002';
 exception when no_data_found then refused:=true;
 end;
 perform pg_temp.review_assert(refused and (select status='proposed' from public.os_review_proposals where id=(p->>'id')::uuid),'interrupted transaction leaves proposal unsaved');
 perform pg_temp.review_assert((select count(*)=0 from public.os_work_items where company_id=company),'interrupted transaction rolls back draft');
 p:=public.os_review_decide((edited->>'id')::uuid,company,actor,2,edited->>'fingerprint','save_to_work');
 perform pg_temp.review_assert(p->>'status'='saved' and p->>'record_id' is not null,'retry after known rollback saves');
 -- Treat the successful response as lost; querying and repeating identical
 -- confirmation must recover the same record without a new effect.
 retried:=public.os_review_decide((edited->>'id')::uuid,company,actor,2,edited->>'fingerprint','save_to_work');
 perform pg_temp.review_assert(retried=p,'lost save response retry returns same receipt');
 perform pg_temp.review_assert((select count(*)=1 from public.os_work_items where company_id=company),'retry creates exactly one work item');
 perform pg_temp.review_assert((select status='drafted' and required_action='send' and notes=edited#>>'{payload,body}' from public.os_work_items where id=(p->>'record_id')::uuid),'saved work exact and draft not approved');
 perform pg_temp.review_assert((select count(*)=0 from public.os_approvals where item_id=(p->>'record_id')::uuid),'saving creates no approval');
 perform pg_temp.review_assert((select count(*)=1 from public.os_work_item_events e where item_id=(p->>'record_id')::uuid and e.actor=proof.actor and event='saved_from_review'),'save creates one event');
 second:=public.os_review_propose('f81961af-922d-4d01-a004-000000000002',turn_id,company,actor,payload||'{"title":"Other title"}'::jsonb);
 perform pg_temp.review_denied(format('select public.os_review_decide(%L,%L,%L,1,%L,%L,%L::jsonb)',second->>'id',company,actor,second->>'fingerprint','revise',edited->'payload'),'cannot edit into already saved duplicate');
 second:=public.os_review_decide((second->>'id')::uuid,company,actor,1,second->>'fingerprint','dismiss');
 perform pg_temp.review_denied(format('select public.os_review_decide(%L,%L,%L,1,%L,%L)',second->>'id',company,actor,second->>'fingerprint','save_to_work'),'dismissed proposal cannot save');
 payload:=jsonb_build_object('type','knowledge','statement','Payment is required in advance.','kind','constraint',
  'scope',jsonb_build_object('type','company','label','Review proof company A'),'duration',jsonb_build_object('type','until_changed'),
  'citations',jsonb_build_array(jsonb_build_object('sourceId',started#>>'{turn,person_message_id}','quote','Our general rule is payment in advance.')));
 memory:=public.os_review_propose('f81961af-922d-4d01-a004-000000000003',turn_id,company,actor,payload);
 perform pg_temp.review_assert((select count(*)=0 from public.os_company_memory where company_id=company),'knowledge proposal does not create memory');
 perform pg_temp.review_denied(format('select public.os_review_propose(%L,%L,%L,%L,%L::jsonb)',gen_random_uuid(),turn_id,company,actor,payload-'scope'),'memory missing scope rejected');
 perform pg_temp.review_denied(format('select public.os_review_propose(%L,%L,%L,%L,%L::jsonb)',gen_random_uuid(),turn_id,company,actor,payload-'duration'),'memory missing duration rejected');
 perform pg_temp.review_denied(format('select public.os_review_propose(%L,%L,%L,%L,%L::jsonb)',gen_random_uuid(),turn_id,company,actor,jsonb_set(payload,'{duration}','{"type":"until_date","date":"2000-01-01"}')),'expired knowledge rejected');
 perform pg_temp.review_denied(format('select public.os_review_propose(%L,%L,%L,%L,%L::jsonb)',gen_random_uuid(),turn_id,company,actor,jsonb_set(payload,'{duration}','{"type":"until_date","date":"2099-02-30"}')),'impossible calendar date rejected');
 memory:=public.os_review_decide((memory->>'id')::uuid,company,actor,1,memory->>'fingerprint','add_to_company_knowledge');
 perform pg_temp.review_assert((select source='cofounder' and created_by is null and confirmed_by=actor and review_scope=payload->'scope' and review_duration=payload->'duration' and review_provenance->>'externallyVerified'='false' from public.os_company_memory where id=(memory->>'record_id')::uuid),'knowledge preserves model authorship scope and human confirmation');
 retried:=public.os_review_decide((memory->>'id')::uuid,company,actor,1,memory->>'fingerprint','add_to_company_knowledge');
 perform pg_temp.review_assert(retried=memory and (select count(*)=1 from public.os_company_memory where company_id=company),'knowledge response retry does not duplicate');
 perform pg_temp.review_denied(format('update public.os_company_memory set review_scope=%L::jsonb where id=%L','{"type":"customer","label":"changed"}',memory->>'record_id'),'memory attribution cannot be rewritten by service');
 perform pg_temp.review_denied(format('update public.os_review_proposal_revisions set payload=%L::jsonb where proposal_id=%L','{}',memory->>'id'),'revision history cannot be rewritten');
 retried:=public.os_review_finish(turn_id,company,actor,'Review the prepared suggestions.','completed',10,20,0);
 perform pg_temp.review_assert(retried->>'status'='completed','turn completion persisted');
 started:=public.os_review_finish(turn_id,company,actor,'Different late completion.','failed',0,0,0);
 perform pg_temp.review_assert(started=retried,'duplicate finish preserves original reply');
 perform pg_temp.review_assert((select count(*)=2 from public.os_messages where thread_id=(retried->>'thread_id')::uuid),'finish retry does not duplicate assistant message');
 perform pg_temp.review_denied(format('select public.os_review_propose(%L,%L,%L,%L,%L::jsonb)',gen_random_uuid(),turn_id,company,actor,payload||'{"statement":"Another statement."}'::jsonb),'new model proposal after finish rejected');
 second:=public.os_review_begin('f81961af-922d-4d01-a003-000000000002',company,actor,'A future separate question.','ask');
 perform pg_temp.review_assert(jsonb_array_length(second#>'{turn,history}')=2,'next turn captures the committed conversation prefix');
 perform pg_temp.review_assert(not exists(select 1 from jsonb_array_elements(second#>'{turn,history}') h where h->>'body'='A future separate question.'),'current source excluded from its prior history');
 retried:=public.os_review_begin(turn_id,company,actor,question,'both');
 perform pg_temp.review_assert(retried#>'{turn,history}'='[]'::jsonb,'old turn retry excludes future messages and retains snapshot');
 perform pg_temp.review_denied(format('select public.os_review_interrupt(%L,%L,%L)',second#>>'{turn,id}',company,actor),'recent running turn cannot be interrupted');
 retried:=public.os_review_interrupt(turn_id,company,actor);
 perform pg_temp.review_assert(retried->>'status'='completed' and retried->>'reply'='Review the prepared suggestions.','interrupt completed turn returns existing terminal receipt');
end; $$;
reset role;

-- Aging is a postgres-only fixture operation, never an app permission. The
-- service role cannot edit created_at to bypass the recovery waiting window.
update public.os_review_turns set created_at=clock_timestamp()-interval '4 minutes'
 where id='f81961af-922d-4d01-a003-000000000002';
set local role service_role;
do $$ declare
 t jsonb; again jsonb; payload jsonb; source_id text;
 company constant uuid:='f81961af-922d-4d01-a001-000000000001';
 actor constant uuid:='f81961af-922d-4d01-a002-000000000001';
 turn_id constant uuid:='f81961af-922d-4d01-a003-000000000002';
begin
 perform pg_temp.review_denied(format('select public.os_review_interrupt(%L,%L,%L)',turn_id,company,'f81961af-922d-4d01-a002-000000000002'),'second member cannot interrupt original actor turn');
 t:=public.os_review_interrupt(turn_id,company,actor);
 perform pg_temp.review_assert(t->>'status'='failed' and t->>'reply'='Interrupted before completion could be confirmed; review stored suggestions separately.','old running turn closes honestly without regeneration');
 again:=public.os_review_interrupt(turn_id,company,actor);
 perform pg_temp.review_assert(again=t,'interruption retry returns same terminal receipt');
 again:=public.os_review_finish(turn_id,company,actor,'A late model answer.','completed',10,10,0);
 perform pg_temp.review_assert(again=t,'late model completion cannot reopen interrupted turn');
 source_id:=t->>'person_message_id';
 payload:=jsonb_build_object('type','work','title','Late work','body','Late work must not stage.','lane','ops','kind','note','outwardAction',null,
  'citations',jsonb_build_array(jsonb_build_object('sourceId',source_id,'quote','A future separate question.')));
 perform pg_temp.review_denied(format('select public.os_review_propose(%L,%L,%L,%L,%L::jsonb)',gen_random_uuid(),turn_id,company,actor,payload),'late model proposal cannot reopen interrupted turn');
 perform pg_temp.review_assert((select count(*)=1 from public.os_messages where id=(t->>'reply_message_id')::uuid and body=t->>'reply'),'interruption has exactly one durable terminal message');
 perform pg_temp.review_assert((select count(*)=0 from public.os_review_proposals p where p.turn_id='f81961af-922d-4d01-a003-000000000002'),'interruption creates no proposals');
end; $$;
reset role;

-- Revoking membership or beta must close the service RPC too; RLS bypass is
-- not permission for p_actor to continue confirming old suggestions.
savepoint entitlement_proof;
delete from internal.os_beta_members where user_id='f81961af-922d-4d01-a002-000000000001';
set local role service_role;
select pg_temp.review_denied($q$select public.os_review_begin('f81961af-922d-4d01-a003-000000000001','f81961af-922d-4d01-a001-000000000001','f81961af-922d-4d01-a002-000000000001','Draft a reply to Mara: the quote is 500 units. Our general rule is payment in advance.','both')$q$,'revoked beta cannot recover through service RPC');
reset role;
rollback to entitlement_proof;

select pg_temp.review_assert(not has_table_privilege('authenticated','public.os_company_memory','INSERT'),'memory table-wide insert removed');
select pg_temp.review_assert(has_column_privilege('authenticated','public.os_company_memory','fact','INSERT') and not has_column_privilege('authenticated','public.os_company_memory','review_provenance','INSERT'),'human memory columns allowed attribution columns refused');
select pg_temp.review_assert(not has_table_privilege('authenticated','public.os_review_proposals','INSERT') and not has_table_privilege('authenticated','public.os_review_proposals','UPDATE'),'authenticated cannot write review rows');
select pg_temp.review_assert(not has_table_privilege('service_role','public.os_review_proposals','INSERT') and has_column_privilege('service_role','public.os_review_proposals','payload','INSERT'),'service review writes column scoped');
select pg_temp.review_assert(not has_function_privilege('authenticated','public.os_review_decide(uuid,uuid,uuid,integer,text,text,jsonb)','EXECUTE') and not has_function_privilege('anon','public.os_review_decide(uuid,uuid,uuid,integer,text,text,jsonb)','EXECUTE'),'review confirmation RPC service only');
select pg_temp.review_assert(not has_function_privilege('authenticated','public.os_review_interrupt(uuid,uuid,uuid)','EXECUTE') and has_function_privilege('service_role','public.os_review_interrupt(uuid,uuid,uuid)','EXECUTE'),'interruption RPC service only');
select pg_temp.review_assert(not has_column_privilege('service_role','public.os_review_turns','created_at','UPDATE'),'service cannot manufacture interrupted age');
select pg_temp.review_assert(not has_table_privilege('service_role','public.os_review_turns','INSERT') and has_column_privilege('service_role','public.os_review_turns','request_mode','INSERT') and not has_column_privilege('service_role','public.os_review_turns','request_mode','UPDATE'),'mode insertion narrow and immutable to service role');
select pg_temp.review_assert(to_regprocedure('public.os_review_begin(uuid,uuid,uuid,text)') is null,'old four-argument begin overload removed');
select pg_temp.review_assert(not has_function_privilege('authenticated','public.os_review_begin(uuid,uuid,uuid,text,text)','EXECUTE') and not has_function_privilege('anon','public.os_review_begin(uuid,uuid,uuid,text,text)','EXECUTE') and has_function_privilege('service_role','public.os_review_begin(uuid,uuid,uuid,text,text)','EXECUTE'),'mode-aware begin service only');

set local request.jwt.claim.sub='f81961af-922d-4d01-a002-000000000001';
set local role authenticated;
select pg_temp.review_assert((select count(*)=3 from public.os_review_proposals where company_id='f81961af-922d-4d01-a001-000000000001'),'member can reload proposals');
select pg_temp.review_denied($q$select public.os_review_begin(gen_random_uuid(),'f81961af-922d-4d01-a001-000000000001','f81961af-922d-4d01-a002-000000000001','forged','ask')$q$,'browser cannot call review RPC');
select pg_temp.review_denied($q$insert into public.os_company_memory(company_id,fact,kind,confirmed_by) values('f81961af-922d-4d01-a001-000000000001','Forged confirmation','fact','f81961af-922d-4d01-a002-000000000001')$q$,'browser cannot forge confirmation columns');
insert into public.os_company_memory(company_id,fact,kind) values('f81961af-922d-4d01-a001-000000000001','Direct human knowledge still works.','fact');
select pg_temp.review_assert((select count(*)=1 from public.os_company_memory where company_id='f81961af-922d-4d01-a001-000000000001' and source='person' and confirmed_by is null),'existing direct human knowledge stays separate');
reset role;
set local request.jwt.claim.sub='f81961af-922d-4d01-a002-000000000003';
set local role authenticated;
select pg_temp.review_assert((select count(*)=0 from public.os_review_turns where company_id='f81961af-922d-4d01-a001-000000000001'),'outsider turns hidden');
select pg_temp.review_assert((select count(*)=0 from public.os_review_proposals where company_id='f81961af-922d-4d01-a001-000000000001'),'outsider proposals hidden');
select pg_temp.review_assert((select count(*)=0 from public.os_review_proposal_revisions where proposal_id::text like 'f81961af-922d-4d01-%'),'outsider revision history hidden');
reset role;
set local request.jwt.claim.sub='';
set local role anon;
select pg_temp.review_denied('select * from public.os_review_proposals','anonymous review read refused');
reset role;

-- The stored mode is an enforced ceiling, not just a label in the UI. Every
-- proposal below is structurally valid and cites the exact founder message.
set local role service_role;
do $$
declare
 company constant uuid:='f81961af-922d-4d01-a001-000000000001';
 actor constant uuid:='f81961af-922d-4d01-a002-000000000001';
 chosen jsonb; draft jsonb; knowledge jsonb; work_payload jsonb; memory_payload jsonb;
begin
 perform pg_temp.review_denied(format('select public.os_review_begin(%L,%L,%L,%L,%L)',gen_random_uuid(),company,actor,'Question','unsupported'),'unknown selected mode rejected');
 perform pg_temp.review_denied(format('select public.os_review_begin(%L,%L,%L,%L,null)',gen_random_uuid(),company,actor,'Question'),'missing selected mode rejected');

 chosen:=public.os_review_begin('f81961af-922d-4d01-a003-000000000003',company,actor,'Draft a reply: six crates.','draft');
 work_payload:=jsonb_build_object('type','work','title','Six crate reply','body','We can discuss six crates.','lane','sales','kind','reply','outwardAction','send',
   'citations',jsonb_build_array(jsonb_build_object('sourceId',chosen#>>'{turn,person_message_id}','quote','six crates')));
 memory_payload:=jsonb_build_object('type','knowledge','statement','Six crates were mentioned.','kind','fact',
   'scope',jsonb_build_object('type','company','label','Review proof company A'),'duration',jsonb_build_object('type','until_changed'),
   'citations',jsonb_build_array(jsonb_build_object('sourceId',chosen#>>'{turn,person_message_id}','quote','six crates')));
 draft:=public.os_review_propose(gen_random_uuid(),(chosen#>>'{turn,id}')::uuid,company,actor,work_payload);
 perform pg_temp.review_assert(draft#>>'{payload,type}'='work','draft mode permits work proposal');
 -- Work items permit any nonempty action up to 60 characters; the stricter
 -- lowercase/trim CHECK belongs to workflows. A staged review value must
 -- reach Work unchanged, while remaining a draft with no approval.
 work_payload:=jsonb_set(work_payload,'{outwardAction}','"  SeNd  "'::jsonb);
 draft:=public.os_review_propose(gen_random_uuid(),(chosen#>>'{turn,id}')::uuid,company,actor,work_payload);
 draft:=public.os_review_decide((draft->>'id')::uuid,company,actor,1,draft->>'fingerprint','save_to_work');
 perform pg_temp.review_assert((select status='drafted' and required_action='  SeNd  ' from public.os_work_items where id=(draft->>'record_id')::uuid),'staged mixed-case spaced action saves to Work unchanged');
 perform pg_temp.review_assert((select count(*)=0 from public.os_approvals where item_id=(draft->>'record_id')::uuid),'staged mixed-case spaced action does not create approval');
 perform pg_temp.review_denied(format('select public.os_review_propose(%L,%L,%L,%L,%L::jsonb)',gen_random_uuid(),chosen#>>'{turn,id}',company,actor,memory_payload),'draft mode rejects knowledge proposal');

 chosen:=public.os_review_begin('f81961af-922d-4d01-a003-000000000004',company,actor,'Our rule is six crates each Monday. Remember it.','knowledge');
 memory_payload:=jsonb_set(memory_payload,'{citations,0,sourceId}',to_jsonb(chosen#>>'{turn,person_message_id}'));
 memory_payload:=jsonb_set(memory_payload,'{citations,0,quote}','"six crates each Monday"'::jsonb);
 work_payload:=jsonb_set(work_payload,'{citations,0,sourceId}',to_jsonb(chosen#>>'{turn,person_message_id}'));
 knowledge:=public.os_review_propose(gen_random_uuid(),(chosen#>>'{turn,id}')::uuid,company,actor,memory_payload);
 perform pg_temp.review_assert(knowledge#>>'{payload,type}'='knowledge','knowledge mode permits memory proposal');
 perform pg_temp.review_denied(format('select public.os_review_propose(%L,%L,%L,%L,%L::jsonb)',gen_random_uuid(),chosen#>>'{turn,id}',company,actor,work_payload),'knowledge mode rejects work proposal');

 chosen:=public.os_review_begin('f81961af-922d-4d01-a003-000000000005',company,actor,'What is our plan for six crates?','ask');
 work_payload:=jsonb_set(work_payload,'{citations,0,sourceId}',to_jsonb(chosen#>>'{turn,person_message_id}'));
 memory_payload:=jsonb_set(memory_payload,'{citations,0,sourceId}',to_jsonb(chosen#>>'{turn,person_message_id}'));
 memory_payload:=jsonb_set(memory_payload,'{citations,0,quote}','"six crates"'::jsonb);
 perform pg_temp.review_denied(format('select public.os_review_propose(%L,%L,%L,%L,%L::jsonb)',gen_random_uuid(),chosen#>>'{turn,id}',company,actor,work_payload),'ask mode rejects work proposal');
 perform pg_temp.review_denied(format('select public.os_review_propose(%L,%L,%L,%L,%L::jsonb)',gen_random_uuid(),chosen#>>'{turn,id}',company,actor,memory_payload),'ask mode rejects knowledge proposal');
 perform pg_temp.review_assert((select count(*)=0 from public.os_review_proposals where turn_id=(chosen#>>'{turn,id}')::uuid),'ask mode stages no suggestions');
end; $$;
reset role;

select 'PASS: durable review SQL/RLS transaction proof' as result,count(*) as assertions from pg_temp.review_assertions;
\if :{?inject_failure}
  select 1/0 as intentional_disconnect_rollback;
\endif
rollback;
do $$ begin
  if exists(select 1 from auth.users where id::text like 'f81961af-922d-4d01-%')
     or exists(select 1 from public.os_companies where id::text like 'f81961af-922d-4d01-%') then
    raise exception 'review fixtures survived rollback';
  end if;
end; $$;
select 'PASS: synthetic review fixtures absent after rollback' as cleanup;
