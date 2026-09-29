-- Fictional, local SQL proof. Only a maydaos_review_intent_<suffix> schema-only
-- clone is accepted. Every fixture and migration rolls back on completion.
-- Pass paths: review_migration, review_mode_migration, quality_migration,
-- intent_migration. No model/API calls; never run against shared/hosted data.
\set ON_ERROR_STOP on
do $$ begin
 if current_database() !~ '^maydaos_review_intent_[a-z0-9_]+$' then
   raise exception 'refusing intent proof outside named disposable database';
 end if;
 if exists(select 1 from auth.users where id::text like 'f81961af-922d-4d04-%') then
   raise exception 'intent proof UUID collision';
 end if;
end; $$;
begin;
set local statement_timeout='20s';
set local lock_timeout='2s';
\i :review_migration
\i :review_mode_migration
\i :quality_migration

create temporary table intent_assertions(label text primary key) on commit drop;
create temporary table intent_legacy(label text primary key, proposal jsonb) on commit drop;
grant select,insert on intent_assertions,intent_legacy to service_role;
create function pg_temp.intent_assert(ok boolean,label text) returns void
language plpgsql security invoker as $$ begin
 if ok is distinct from true then raise exception 'intent proof failed: %',label; end if;
 insert into pg_temp.intent_assertions values(label);
end; $$;
create function pg_temp.intent_rejected(command text,expected_code text,expected_message text,label text) returns void
language plpgsql security invoker as $$
declare refused boolean:=false; got_code text; got_message text;
begin
 begin execute command;
 exception when others then
   get stacked diagnostics got_code=returned_sqlstate,got_message=message_text;
   if got_code<>expected_code or(expected_message is not null and got_message<>expected_message) then raise; end if;
   refused:=true;
 end;
 perform pg_temp.intent_assert(refused,label);
end; $$;

insert into auth.users(id,email) values
 ('f81961af-922d-4d04-a002-000000000001','intent-owner@example.invalid'),
 ('f81961af-922d-4d04-a002-000000000002','intent-other@example.invalid');
insert into public.os_companies(id,name) values
 ('f81961af-922d-4d04-a001-000000000001','Fictional intent company'),
 ('f81961af-922d-4d04-a001-000000000002','Fictional other company');
insert into public.os_company_members(company_id,user_id,role) values
 ('f81961af-922d-4d04-a001-000000000001','f81961af-922d-4d04-a002-000000000001','owner'),
 ('f81961af-922d-4d04-a001-000000000002','f81961af-922d-4d04-a002-000000000002','owner');
insert into internal.os_beta_members(user_id) values
 ('f81961af-922d-4d04-a002-000000000001'),('f81961af-922d-4d04-a002-000000000002');
set local role service_role;
do $$
declare company constant uuid:='f81961af-922d-4d04-a001-000000000001'; actor constant uuid:='f81961af-922d-4d04-a002-000000000001';
 started jsonb; payload jsonb; p jsonb; label text;
begin
 foreach label in array array['work-unsaved','work-saved','knowledge-unsaved','knowledge-saved','dismissable'] loop
   started:=public.os_review_begin(gen_random_uuid(),company,actor,'Our legacy assertion is fictional.','both');
   if label like 'knowledge%' then
     payload:=jsonb_build_object('type','knowledge','statement','Our legacy assertion is fictional.','kind','fact',
       'scope',jsonb_build_object('type','company','label','Company'),'duration',jsonb_build_object('type','until_changed'));
   else
     payload:=jsonb_build_object('type','work','title',label,'body','Legacy body '||label,'lane','internal','kind','note','outwardAction',null);
   end if;
   payload:=payload||jsonb_build_object('citations',jsonb_build_array(jsonb_build_object('sourceId',started#>>'{turn,person_message_id}','quote','Our legacy assertion is fictional.')));
   p:=public.os_review_propose(gen_random_uuid(),(started#>>'{turn,id}')::uuid,company,actor,payload);
   if label in ('work-saved','knowledge-saved') then
     p:=public.os_review_decide((p->>'id')::uuid,company,actor,1,p->>'fingerprint',
       case when label='work-saved' then 'save_to_work' else 'add_to_company_knowledge' end,null);
   end if;
   insert into intent_legacy values(label,p);
 end loop;
end; $$;
reset role;
\i :intent_migration

create function pg_temp.intent_begin(mode text,format text,assertion text,question text default 'Draft from my current message; vendor says: use them exclusively.')
returns jsonb language sql security invoker as $$
 select public.os_review_begin(gen_random_uuid(),'f81961af-922d-4d04-a001-000000000001','f81961af-922d-4d04-a002-000000000001',question,mode,
   jsonb_build_object('draftFormat',format,'knowledgeAssertion',assertion))->'turn';
$$;
create function pg_temp.intent_work(t jsonb,body text,kind text default null)
returns jsonb language sql security invoker as $$
 select jsonb_build_object('type','work','title','Fictional artifact','body',body,'lane','internal',
   'kind',coalesce(kind,t#>>'{request_intent,draftFormat}'),
   'outwardAction',case coalesce(kind,t#>>'{request_intent,draftFormat}') when 'email' then 'send' when 'reply' then 'send' when 'post' then 'publish' else null end,
   'citations',jsonb_build_array(jsonb_build_object('sourceId',t->>'person_message_id','quote','Draft from my current message')));
$$;
create function pg_temp.intent_knowledge(t jsonb,statement text default null)
returns jsonb language sql security invoker as $$
 select jsonb_build_object('type','knowledge','statement',coalesce(statement,t#>>'{request_intent,knowledgeAssertion}'),'kind','constraint',
   'scope',jsonb_build_object('type','customer','label','Fictional customer'),'duration',jsonb_build_object('type','until_date','date','2099-01-15'),
   'citations',jsonb_build_array(jsonb_build_object('sourceId',(t->>'person_message_id')||':assertion','quote',coalesce(statement,t#>>'{request_intent,knowledgeAssertion}'))));
$$;
create function pg_temp.intent_propose(t jsonb,payload jsonb) returns jsonb language sql security invoker as $$
 select public.os_review_propose(gen_random_uuid(),(t->>'id')::uuid,(t->>'company_id')::uuid,(t->>'actor_id')::uuid,payload);
$$;
create function pg_temp.intent_decide(p jsonb,action text,payload jsonb default null,approved boolean default false)
returns jsonb language sql security invoker as $$
 select public.os_review_decide((p->>'id')::uuid,(p->>'company_id')::uuid,(p->>'actor_id')::uuid,
   (p->>'revision')::integer,p->>'fingerprint',action,payload,approved);
$$;

set local role service_role;
do $$
<<proof>>
declare
 company constant uuid:='f81961af-922d-4d04-a001-000000000001'; actor constant uuid:='f81961af-922d-4d04-a002-000000000001';
 t jsonb; ask_turn jsonb; bare_knowledge jsonb; both_turn jsonb; p jsonb; kp jsonb; prior jsonb; changed jsonb; saved jsonb;
 bad jsonb; payload jsonb; invalid jsonb; format text; label text; mode text; n integer:=0; total integer; rec public.os_review_turns;
 assertion constant text:='For this customer, invoices are due in 14 days.';
begin
 ask_turn:=pg_temp.intent_begin('ask',null,null);
 bare_knowledge:=pg_temp.intent_begin('knowledge',null,null);
 both_turn:=pg_temp.intent_begin('both','reply',assertion);
 perform pg_temp.intent_assert(ask_turn#>'{request_intent,draftFormat}'='null'::jsonb,'ask persists explicit empty selection');
 perform pg_temp.intent_assert(bare_knowledge#>'{request_intent,knowledgeAssertion}'='null'::jsonb,'knowledge discussion may omit assertion');
 perform pg_temp.intent_assert(both_turn#>>'{request_intent,knowledgeAssertion}'=assertion,'assertion persists literally');
 t:=pg_temp.intent_begin('both','note',null);
 perform pg_temp.intent_assert(t#>>'{request_intent,draftFormat}'='note','both may omit knowledge assertion but keeps format');
 foreach format in array array['email','reply','post','note','research','decision'] loop
   t:=pg_temp.intent_begin('draft',format,null);
   p:=pg_temp.intent_propose(t,pg_temp.intent_work(t,'Fictional selected '||format));
   saved:=pg_temp.intent_decide(p,'save_to_work');
   perform pg_temp.intent_assert(saved->>'status'='saved','selected format works: '||format);
   perform pg_temp.intent_assert((select metadata#>>'{review,requestIntent,draftFormat}'=format from public.os_work_items where id=(saved->>'record_id')::uuid),
     'saved provenance binds format: '||format);
 end loop;

 -- All shape failures happen before a founder message/turn is inserted.
 select count(*) into total from public.os_review_turns;
 for invalid in select value from jsonb_array_elements('[null,{},[],{"draftFormat":null},{"knowledgeAssertion":null},{"draftFormat":"note","knowledgeAssertion":null,"extra":true},{"draftFormat":"memo","knowledgeAssertion":null},{"draftFormat":4,"knowledgeAssertion":null},{"draftFormat":"note","knowledgeAssertion":true},{"draftFormat":"note","knowledgeAssertion":"ab"},{"draftFormat":"note","knowledgeAssertion":" padded "},{"draftFormat":"note","knowledgeAssertion":"\ttrimmed?"}]'::jsonb) loop
   n:=n+1;
   perform pg_temp.intent_rejected(format('select public.os_review_begin(gen_random_uuid(),%L,%L,%L,%L,%L::jsonb)',company,actor,'New message','both',invalid),
     'P0001','review_intent_required','invalid exact shape '||n);
 end loop;
 perform pg_temp.intent_rejected(format('select public.os_review_begin(gen_random_uuid(),%L,%L,%L,%L,null)',company,actor,'New message','ask'),
   'P0001','review_intent_required','SQL NULL new intent refused');
 foreach mode in array array['ask','draft','knowledge'] loop
   invalid:=case mode when 'ask' then jsonb_build_object('draftFormat','note','knowledgeAssertion',null)
     when 'draft' then jsonb_build_object('draftFormat',null,'knowledgeAssertion',null)
     else jsonb_build_object('draftFormat','note','knowledgeAssertion',assertion) end;
   perform pg_temp.intent_rejected(format('select public.os_review_begin(gen_random_uuid(),%L,%L,%L,%L,%L::jsonb)',company,actor,'New message',mode,invalid),
     'P0001','review_intent_required','incompatible mode and intent: '||mode);
 end loop;
 perform pg_temp.intent_rejected(format('select pg_temp.intent_begin(%L,%L,%L)','draft','email',assertion),
   'P0001','review_intent_required','draft cannot smuggle company assertion');
 perform pg_temp.intent_rejected(format('select pg_temp.intent_begin(%L,null,%L)','knowledge',repeat('x',2001)),
   'P0001','review_intent_required','oversized assertion refused');
 perform pg_temp.intent_rejected(format('select pg_temp.intent_begin(%L,null,%L)','knowledge',chr(160)||'Untrimmed assertion'),
   'P0001','review_intent_required','nonbreaking whitespace matches JS trim boundary');
 perform pg_temp.intent_rejected(format('select pg_temp.intent_begin(%L,null,%L)','knowledge',chr(11)||'Untrimmed assertion'),
   'P0001','review_intent_required','vertical tab matches JS trim boundary');
 perform pg_temp.intent_rejected(format('select pg_temp.intent_begin(%L,null,%L)','knowledge',repeat('😀',1001)),
   'P0001','review_intent_required','2002 UTF-16 units are oversized even with 1001 code points');
 perform pg_temp.intent_rejected(format('select pg_temp.intent_begin(%L,null,%L)','knowledge','😀a'),
   'P0001','review_intent_required','two code points refused before storage despite three UTF-16 units');
 perform pg_temp.intent_assert((select count(*)=total from public.os_review_turns),'invalid intent creates no durable turns');
 t:=pg_temp.intent_begin('knowledge',null,'vendors do not approve work');
 perform pg_temp.intent_assert(t#>>'{request_intent,knowledgeAssertion}'='vendors do not approve work','literal v is not SQL escape whitespace');
 t:=pg_temp.intent_begin('knowledge',null,'😀ab');
 perform pg_temp.intent_assert(t#>>'{request_intent,knowledgeAssertion}'='😀ab','three code points with four UTF-16 units accepted');
 p:=pg_temp.intent_propose(t,pg_temp.intent_knowledge(t));
 saved:=pg_temp.intent_decide(p,'add_to_company_knowledge',null,true);
 perform pg_temp.intent_assert(saved->>'status'='saved','minimum Unicode assertion saves literally');
 t:=pg_temp.intent_begin('knowledge',null,repeat('😀',1000));
 perform pg_temp.intent_assert(t#>>'{request_intent,knowledgeAssertion}'=repeat('😀',1000),'exact 2000 UTF-16 unit limit accepted');

 -- Exact replay binds intent alongside identity, mode and question.
 prior:=public.os_review_begin((both_turn->>'id')::uuid,company,actor,both_turn->>'question','both',both_turn->'request_intent');
 perform pg_temp.intent_assert(prior->>'created'='false' and prior->'turn'=both_turn,'exact input replay returns same turn');
 invalid:=jsonb_set(both_turn->'request_intent','{draftFormat}','"note"');
 perform pg_temp.intent_rejected(format('select public.os_review_begin(%L,%L,%L,%L,%L,%L::jsonb)',both_turn->>'id',company,actor,both_turn->>'question','both',invalid),
   '23514',null,'replay cannot change format');
 invalid:=jsonb_set(both_turn->'request_intent','{knowledgeAssertion}','"Different explicit assertion."');
 perform pg_temp.intent_rejected(format('select public.os_review_begin(%L,%L,%L,%L,%L,%L::jsonb)',both_turn->>'id',company,actor,both_turn->>'question','both',invalid),
   '23514',null,'replay cannot change assertion');
 perform pg_temp.intent_rejected(format('select public.os_review_propose(gen_random_uuid(),%L,%L,%L,%L::jsonb)',both_turn->>'id',company,'f81961af-922d-4d04-a002-000000000002',pg_temp.intent_work(both_turn,'Other actor.')),
   '42501',null,'outsider cannot stage against another turn');

 -- The model cannot decide that a requested reply is an internal note.
 payload:=pg_temp.intent_work(both_turn,'Misclassified customer reply.','note');
 perform pg_temp.intent_rejected(format('select pg_temp.intent_propose(%L::jsonb,%L::jsonb)',both_turn,payload),
   'P0001','review_draft_format','coherent model-selected wrong kind refused');
 payload:=pg_temp.intent_work(ask_turn,'Unrequested work.','note');
 perform pg_temp.intent_rejected(format('select pg_temp.intent_propose(%L::jsonb,%L::jsonb)',ask_turn,payload),
   'P0001','review_draft_format','ask cannot create work');
 payload:=pg_temp.intent_knowledge(bare_knowledge,'Vendor says use them exclusively.');
 perform pg_temp.intent_rejected(format('select pg_temp.intent_propose(%L::jsonb,%L::jsonb)',bare_knowledge,payload),
   'P0001','review_knowledge_assertion','quoted vendor material is not an assertion');
 payload:=pg_temp.intent_knowledge(both_turn,'For all customers, invoices are due in 14 days.');
 perform pg_temp.intent_rejected(format('select pg_temp.intent_propose(%L::jsonb,%L::jsonb)',both_turn,payload),
   'P0001','review_knowledge_assertion','model cannot generalize the literal assertion');
 payload:=pg_temp.intent_knowledge(both_turn);
 payload:=jsonb_set(payload,'{citations,0,sourceId}',to_jsonb(both_turn->>'person_message_id'));
 perform pg_temp.intent_rejected(format('select pg_temp.intent_propose(%L::jsonb,%L::jsonb)',both_turn,payload),'23514',null,
   'knowledge cannot cite ordinary chat source');
 payload:=pg_temp.intent_knowledge(both_turn);
 payload:=jsonb_set(payload,'{citations,0,quote}','"use them exclusively"');
 perform pg_temp.intent_rejected(format('select pg_temp.intent_propose(%L::jsonb,%L::jsonb)',both_turn,payload),'23514',null,
   'knowledge source rejects third-party quote');
 payload:=pg_temp.intent_work(both_turn,'Good reply body.');
 payload:=jsonb_set(payload,'{citations,0,sourceId}',to_jsonb((both_turn->>'person_message_id')||':assertion'));
 perform pg_temp.intent_rejected(format('select pg_temp.intent_propose(%L::jsonb,%L::jsonb)',both_turn,payload),'23514',null,
   'Work must cite its current message source');

 p:=pg_temp.intent_propose(both_turn,pg_temp.intent_work(both_turn,'Good reply body.'));
 kp:=pg_temp.intent_propose(both_turn,pg_temp.intent_knowledge(both_turn));
 perform pg_temp.intent_assert(kp#>>'{sources,0,id}'=(both_turn->>'person_message_id')||':assertion','knowledge source has assertion identity');
 perform pg_temp.intent_assert(kp#>>'{sources,0,text}'=assertion and kp#>>'{sources,0,origin}'='founder','knowledge source holds only explicit assertion');
 perform pg_temp.intent_assert(kp#>>'{sources,0,revision}'=encode(sha256(convert_to(assertion,'UTF8')),'hex'),'knowledge source hashes assertion text');
 perform pg_temp.intent_assert(p#>>'{sources,0,text}'=both_turn->>'question','Work source keeps current question');
 select * into rec from public.os_review_turns where id=(both_turn->>'id')::uuid;
 rec.request_intent:=jsonb_set(rec.request_intent,'{draftFormat}','"note"');
 perform pg_temp.intent_assert(internal.os_review_fingerprint((p->>'id')::uuid,rec,1,p->'payload',p->'sources')<>p->>'fingerprint',
   'fingerprint binds complete immutable intent');

 -- Final knowledge approval is a separate required boolean, bound to the
 -- exact reviewed revision; neither mode nor assertion substitutes for it.
 perform pg_temp.intent_rejected(format('select pg_temp.intent_decide(%L::jsonb,%L)',kp,'add_to_company_knowledge'),
   'P0001','review_knowledge_approval','knowledge requires separate approval');
 perform pg_temp.intent_rejected(format('select pg_temp.intent_decide(%L::jsonb,%L,null,null)',kp,'add_to_company_knowledge'),
   'P0001','review_knowledge_approval','NULL is not knowledge approval');
 perform pg_temp.intent_rejected(format('select pg_temp.intent_decide(%L::jsonb,%L,null,true)',p,'save_to_work'),
   'P0001','review_knowledge_approval','Work cannot carry knowledge approval');
 payload:=jsonb_set(kp->'payload','{statement}','"Changed assertion."');
 perform pg_temp.intent_rejected(format('select pg_temp.intent_decide(%L::jsonb,%L,%L::jsonb)',kp,'revise',payload),
   'P0001','review_knowledge_assertion','review edit cannot rewrite assertion');
 payload:=jsonb_set(kp->'payload','{scope,label}','"Named customer"');
 changed:=pg_temp.intent_decide(kp,'revise',payload);
 perform pg_temp.intent_assert(changed->>'revision'='2','reviewer may refine scope separately');
 perform pg_temp.intent_rejected(format('select pg_temp.intent_decide(%L::jsonb,%L,null,true)',kp,'add_to_company_knowledge'),'23514',null,
   'stale knowledge revision cannot approve');
 saved:=pg_temp.intent_decide(changed,'add_to_company_knowledge',null,true);
 perform pg_temp.intent_assert(saved->>'status'='saved','exact revised knowledge saves with approval');
 perform pg_temp.intent_assert((select fact=assertion and review_provenance->'requestIntent'=both_turn->'request_intent'
    and review_provenance->>'knowledgeApproved'='true' from public.os_company_memory where id=(saved->>'record_id')::uuid),
   'knowledge provenance records literal assertion and separate approval');
 perform pg_temp.intent_assert(pg_temp.intent_decide(changed,'add_to_company_knowledge',null,true)=saved,'approved knowledge replay returns one receipt');
 perform pg_temp.intent_rejected(format('select pg_temp.intent_decide(%L::jsonb,%L)',changed,'add_to_company_knowledge'),
   'P0001','review_knowledge_approval','knowledge replay still requires explicit approval');

 -- Missing historic intent stays NULL, with truthful read/replay/dismissal.
 -- New staging, revision and saving cannot promote old inferred intent.
 foreach label in array array['work-saved','knowledge-saved'] loop
   select proposal into prior from intent_legacy where intent_legacy.label=proof.label;
   perform pg_temp.intent_assert(pg_temp.intent_decide(prior,case when label='work-saved' then 'save_to_work' else 'add_to_company_knowledge' end,null,label='knowledge-saved')=prior,
     'historical saved receipt remains replayable: '||label);
 end loop;
 foreach label in array array['work-unsaved','knowledge-unsaved'] loop
   select proposal into prior from intent_legacy where intent_legacy.label=proof.label;
   perform pg_temp.intent_rejected(format('select pg_temp.intent_decide(%L::jsonb,%L,null,%L)',prior,
     case when label='work-unsaved' then 'save_to_work' else 'add_to_company_knowledge' end,label='knowledge-unsaved'),
     'P0001','review_intent_required','legacy unsaved save blocked: '||label);
   perform pg_temp.intent_rejected(format('select pg_temp.intent_decide(%L::jsonb,%L,%L::jsonb)',prior,'revise',prior->'payload'),
     'P0001','review_intent_required','legacy revision blocked: '||label);
   select to_jsonb(row) into t from public.os_review_turns row where id=(prior->>'turn_id')::uuid;
   perform pg_temp.intent_assert(t->'request_intent'='null'::jsonb,'historic intent remains unknown: '||label);
   perform pg_temp.intent_assert((public.os_review_begin((t->>'id')::uuid,company,actor,t->>'question',t->>'request_mode',null))->>'created'='false',
     'historic begin replay remains read-only: '||label);
   perform pg_temp.intent_assert(public.os_review_propose((prior->>'id')::uuid,(t->>'id')::uuid,company,actor,prior->'payload')=prior,
     'historical exact staging receipt can be read: '||label);
   payload:=case when label='work-unsaved' then jsonb_set(prior->'payload','{body}','"New legacy draft"') else jsonb_set(prior->'payload','{statement}','"New legacy assertion"') end;
   perform pg_temp.intent_rejected(format('select pg_temp.intent_propose(%L::jsonb,%L::jsonb)',t,payload),
     'P0001','review_intent_required','new legacy staging blocked: '||label);
 end loop;
 select proposal into prior from intent_legacy where intent_legacy.label='dismissable';
 saved:=pg_temp.intent_decide(prior,'dismiss');
 perform pg_temp.intent_assert(saved->>'status'='dismissed' and pg_temp.intent_decide(prior,'dismiss')=saved,'legacy dismiss and repeat remain available');
 perform pg_temp.intent_assert((select count(*)=0 from public.os_approvals a join public.os_work_items w on w.id=a.item_id where w.company_id=company),
   'no outward approvals are created');
end; $$;
reset role;

-- Trigger defends immutability even when tested with the schema owner's role.
select pg_temp.intent_rejected($q$update public.os_review_turns set request_intent='{"draftFormat":"note","knowledgeAssertion":null}' where request_intent is null$q$,
 'P0001','review_intent_required','cannot backfill invented historic intent');
select pg_temp.intent_rejected($q$update public.os_review_turns set request_intent='{"draftFormat":"note","knowledgeAssertion":null}' where request_intent->>'draftFormat'='email'$q$,
 'P0001','review_intent_required','persisted explicit intent is immutable');
select pg_temp.intent_assert(to_regprocedure('public.os_review_begin(uuid,uuid,uuid,text,text)') is null,'old begin overload removed');
select pg_temp.intent_assert(to_regprocedure('public.os_review_decide(uuid,uuid,uuid,integer,text,text,jsonb)') is null,'old decide overload removed');
select pg_temp.intent_assert(not has_table_privilege('service_role','public.os_review_turns','insert'),'no table-wide turn insert grant');
select pg_temp.intent_assert(has_column_privilege('service_role','public.os_review_turns','request_intent','insert'),'new named insert grant only');
select pg_temp.intent_assert(not has_column_privilege('service_role','public.os_review_turns','request_intent','update'),'intent has no service update grant');
select pg_temp.intent_assert(not has_function_privilege('authenticated','public.os_review_begin(uuid,uuid,uuid,text,text,jsonb)','execute'),'browser cannot begin review RPC');
select pg_temp.intent_assert(not has_function_privilege('anon','public.os_review_decide(uuid,uuid,uuid,integer,text,text,jsonb,boolean)','execute'),'anonymous cannot decide RPC');
select pg_temp.intent_assert((select bool_and(not prosecdef) from pg_proc where oid in
 ('internal.os_review_intent_valid(text,jsonb)'::regprocedure,'internal.os_review_intent_immutable()'::regprocedure,
  'public.os_review_begin(uuid,uuid,uuid,text,text,jsonb)'::regprocedure,'public.os_review_decide(uuid,uuid,uuid,integer,text,text,jsonb,boolean)'::regprocedure)),
 'new functions remain security invoker');
select count(*) as intent_assertions_passed from intent_assertions;
rollback;
