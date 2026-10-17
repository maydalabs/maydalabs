-- Fictional, local SQL proof for agent runs. Only a maydaos_agent_runs_<suffix>
-- schema-only clone at the pre-run migration head is accepted. Every fixture
-- and the migration itself roll back on completion. Pass the absolute path of
-- the new migration as agent_runs_migration; it is applied IN this transaction,
-- after a chat proposal is staged the old way, so (15) proves that proposal
-- still saves. No model/API calls; never run against shared or hosted data.
-- psql -X -v ON_ERROR_STOP=1 -v agent_runs_migration=/abs/20261017200000_agent_runs.sql -f tests/sql/os_agent_runs.sql
\set ON_ERROR_STOP on
do $$ begin
  if current_database() !~ '^maydaos_agent_runs_[a-z0-9_]+$' then
    raise exception 'refusing agent run proof outside named disposable database';
  end if;
  if exists(select 1 from auth.users where id::text like 'f81961af-922d-4d05-%')
     or exists(select 1 from public.os_companies where id::text like 'f81961af-922d-4d05-%') then
    raise exception 'agent run proof UUID collision';
  end if;
end; $$;
\if :{?agent_runs_migration}
\else
  \echo 'agent_runs_migration path is required; nothing changed'
  \quit 1
\endif
begin;
set local statement_timeout='30s';
set local lock_timeout='2s';

create temporary table ar_assertions(label text primary key) on commit drop;
create temporary table ar_state(key text primary key, value jsonb) on commit drop;
grant select,insert,update on ar_assertions,ar_state to service_role,authenticated,anon;
create function pg_temp.ar_assert(ok boolean,label text) returns void
language plpgsql security invoker as $$ begin
  if ok is distinct from true then raise exception 'agent run proof failed: %',label; end if;
  insert into pg_temp.ar_assertions values(label);
end; $$;
create function pg_temp.ar_rejected(command text,expected_code text,expected_message text,label text) returns void
language plpgsql security invoker as $$
declare refused boolean:=false; got_code text; got_message text;
begin
  begin execute command;
  exception when others then
    get stacked diagnostics got_code=returned_sqlstate,got_message=message_text;
    if got_code<>expected_code or(expected_message is not null and got_message<>expected_message) then raise; end if;
    refused:=true;
  end;
  perform pg_temp.ar_assert(refused,label);
end; $$;
create function pg_temp.ar_put(k text,v jsonb) returns void language sql security invoker as $$
  insert into pg_temp.ar_state values(k,v) on conflict(key) do update set value=excluded.value;
$$;
create function pg_temp.ar_get(k text) returns jsonb language sql security invoker as $$
  select value from pg_temp.ar_state where key=k;
$$;
create function pg_temp.ar_item(n integer) returns uuid language sql immutable security invoker as $$
  select ('f81961af-922d-4d05-a003-'||lpad(n::text,12,'0'))::uuid;
$$;

-- Fixtures: company one (owner A, members B and D), company two (owner C).
insert into auth.users(id,email) values
 ('f81961af-922d-4d05-a002-000000000001','runs-owner@example.invalid'),
 ('f81961af-922d-4d05-a002-000000000002','runs-member@example.invalid'),
 ('f81961af-922d-4d05-a002-000000000003','runs-other-company@example.invalid'),
 ('f81961af-922d-4d05-a002-000000000004','runs-second-member@example.invalid');
insert into public.os_companies(id,name) values
 ('f81961af-922d-4d05-a001-000000000001','Fictional runs company'),
 ('f81961af-922d-4d05-a001-000000000002','Fictional other company');
insert into public.os_company_members(company_id,user_id,role) values
 ('f81961af-922d-4d05-a001-000000000001','f81961af-922d-4d05-a002-000000000001','owner'),
 ('f81961af-922d-4d05-a001-000000000001','f81961af-922d-4d05-a002-000000000002','member'),
 ('f81961af-922d-4d05-a001-000000000001','f81961af-922d-4d05-a002-000000000004','member'),
 ('f81961af-922d-4d05-a001-000000000002','f81961af-922d-4d05-a002-000000000003','owner');
-- Fourteen open items in company one, waiting 8 to 21 days; one in company two.
-- Item 2 has waited 9.5 days and a minute: the os_needs_you ::integer rounds it to 10.
insert into public.os_work_items(id,company_id,lane,kind,title,status,required_action,notes,updated_at)
select pg_temp.ar_item(n),'f81961af-922d-4d05-a001-000000000001','sales','reply','Follow up with buyer '||n,
  case when n%3=0 then 'blocked' else 'review' end,'send',
  'Waiting on buyer '||n||' about invoice INV-'||(100+n)||'. Contact: buyer'||n||'@example.invalid.',
  case when n=2 then now()-interval '9 days 12 hours 1 minute' else now()-make_interval(days=>7+n,hours=>1) end
from generate_series(1,14) n;
insert into public.os_work_items(id,company_id,lane,kind,title,status,notes)
values (pg_temp.ar_item(99),'f81961af-922d-4d05-a001-000000000002','sales','reply','Other company item','review','Not yours.');
update public.os_companies set monthly_chat_usd=0.05 where id='f81961af-922d-4d05-a001-000000000002';

-- A chat proposal staged before the migration: (15) must still save it.
set local role service_role;
do $$
declare t jsonb; p jsonb;
begin
  t:=public.os_review_begin(gen_random_uuid(),'f81961af-922d-4d05-a001-000000000001','f81961af-922d-4d05-a002-000000000001',
    'Draft a reply about the legacy crates.','draft',jsonb_build_object('draftFormat','reply','knowledgeAssertion',null))->'turn';
  p:=public.os_review_propose(gen_random_uuid(),(t->>'id')::uuid,'f81961af-922d-4d05-a001-000000000001','f81961af-922d-4d05-a002-000000000001',
    jsonb_build_object('type','work','title','Legacy reply','body','Legacy body, saved after the run migration.','lane','sales',
      'kind','reply','outwardAction','send','citations',jsonb_build_array(jsonb_build_object('sourceId',t->>'person_message_id','quote','Draft a reply'))));
  perform pg_temp.ar_put('legacy_turn',t);
  perform pg_temp.ar_put('legacy_proposal',p);
end; $$;
reset role;

\i :agent_runs_migration

-- Helpers that read the run's own company, actor, lease and seq, so each call
-- below states only what it is testing. plpgsql: bodies resolve at call time.
create function pg_temp.ar_start(id uuid,company uuid,actor uuid,instruction text,format text,payer text,cap numeric,daily numeric default 100,
  min_usd numeric default 0)
returns jsonb language plpgsql security invoker as $$ begin
  return public.os_agent_run_start(id,company,actor,instruction,format,payer,
    case when payer='local' then 'local:fixture' else payer||':fixture' end,cap,daily,min_usd,600);
end; $$;
create function pg_temp.ar_round(run uuid,projected numeric,cap numeric default 100,lease uuid default null,at_seq integer default null)
returns jsonb language plpgsql security invoker as $$ declare r record; begin
  select company_id,actor_id,lease_id,seq into r from public.os_agent_runs where id=run;
  return public.os_agent_run_round(run,r.company_id,r.actor_id,coalesce(lease,r.lease_id),coalesce(at_seq,r.seq),projected,cap);
end; $$;
create function pg_temp.ar_step(run uuid,patch jsonb,lease uuid default null,at_seq integer default null)
returns jsonb language plpgsql security invoker as $$ declare r record; begin
  select company_id,actor_id,lease_id,seq into r from public.os_agent_runs where id=run;
  return public.os_agent_run_step(run,r.company_id,r.actor_id,coalesce(lease,r.lease_id),coalesce(at_seq,r.seq),patch);
end; $$;
create function pg_temp.ar_read(run uuid,item uuid,ref text,lease uuid default null)
returns jsonb language plpgsql security invoker as $$ declare r record; begin
  select company_id,actor_id,lease_id into r from public.os_agent_runs where id=run;
  return public.os_agent_run_read(run,r.company_id,r.actor_id,coalesce(lease,r.lease_id),item,ref);
end; $$;
create function pg_temp.ar_propose(run uuid,proposal uuid,rd jsonb,payload jsonb,lease uuid default null)
returns jsonb language plpgsql security invoker as $$ declare r record; begin
  select company_id,actor_id,lease_id into r from public.os_agent_runs where id=run;
  return public.os_agent_run_propose(run,r.company_id,r.actor_id,coalesce(lease,r.lease_id),proposal,(rd->>'id')::uuid,payload);
end; $$;
create function pg_temp.ar_finish(run uuid,status text,reason text,body text,refused integer default 0,faults integer default 0)
returns jsonb language plpgsql security invoker as $$ declare r record; begin
  select company_id,actor_id,lease_id,seq into r from public.os_agent_runs where id=run;
  return public.os_agent_run_finish(run,r.company_id,r.actor_id,r.lease_id,r.seq,status,reason,body,refused,faults);
end; $$;
create function pg_temp.ar_resume(run uuid,action text,answer text default null,at_seq integer default null)
returns jsonb language plpgsql security invoker as $$ declare r record; begin
  select company_id,actor_id,seq into r from public.os_agent_runs where id=run;
  return public.os_agent_run_resume(run,r.company_id,r.actor_id,coalesce(at_seq,r.seq),action,answer,600);
end; $$;
-- The host builds every card: [the instruction, the capture's title], the capture's lane, the selected format.
create function pg_temp.ar_card(run uuid,rd jsonb,title text,body text,kind text default 'reply')
returns jsonb language plpgsql security invoker as $$ declare t public.os_review_turns; begin
  select * into t from public.os_review_turns where id=run;
  return jsonb_build_object('type','work','title',title,'body',body,'lane',rd->>'lane','kind',kind,
    'outwardAction',case kind when 'email' then 'send' when 'reply' then 'send' when 'post' then 'publish' else null end,
    'citations',jsonb_build_array(jsonb_build_object('sourceId',t.person_message_id::text,'quote',t.question),
      jsonb_build_object('sourceId','read:'||(rd->>'id'),'quote',rd->>'title')));
end; $$;
create function pg_temp.ar_kinds(run uuid) returns jsonb language sql security invoker as $$
  select coalesce(jsonb_agg(e->>'k' order by i),'[]'::jsonb) from public.os_agent_runs r,
    jsonb_array_elements(r.progress) with ordinality as x(e,i) where r.id=run;
$$;
create function pg_temp.ar_decide(p jsonb,action text,payload jsonb default null) returns jsonb language sql security invoker as $$
  select public.os_review_decide((p->>'id')::uuid,(p->>'company_id')::uuid,(p->>'actor_id')::uuid,
    (p->>'revision')::integer,p->>'fingerprint',action,payload,false);
$$;

set local role service_role;
do $$
<<proof>>
declare
  c1 constant uuid:='f81961af-922d-4d05-a001-000000000001'; c2 constant uuid:='f81961af-922d-4d05-a001-000000000002';
  a constant uuid:='f81961af-922d-4d05-a002-000000000001'; b constant uuid:='f81961af-922d-4d05-a002-000000000002';
  c constant uuid:='f81961af-922d-4d05-a002-000000000003';
  r1 constant uuid:='f81961af-922d-4d05-a004-000000000001'; rb constant uuid:='f81961af-922d-4d05-a004-000000000002';
  rc constant uuid:='f81961af-922d-4d05-a004-000000000003';
  instruction constant text:='Prepare follow-ups for everything waiting more than a week.';
  started jsonb; replay jsonb; run public.os_agent_runs; t public.os_review_turns; m public.os_messages;
  rd jsonb; x jsonb; reads jsonb:='{}'::jsonb; p jsonb; payload jsonb; seq_before integer; n integer; result jsonb; old_lease uuid;
begin
  -- (1) Start: a draft turn, the run row, the instruction in the conversation thread.
  started:=pg_temp.ar_start(r1,c1,a,instruction,'reply','local',1.00);
  perform pg_temp.ar_assert(started->>'created'='true' and started#>>'{run,status}'='running' and started->>'lease' is not null,'start creates a running leased run');
  perform pg_temp.ar_assert(not (started->'run' ? 'checkpoint') and not (started->'run' ? 'lease_id'),'start receipt omits checkpoint and lease token');
  select * into t from public.os_review_turns where id=r1;
  perform pg_temp.ar_assert(t.status='running' and t.request_mode='draft' and t.request_intent=jsonb_build_object('draftFormat','reply','knowledgeAssertion',null),'run is a draft turn bound to the chosen format');
  select * into m from public.os_messages where id=t.person_message_id;
  perform pg_temp.ar_assert(m.role='person' and m.body=instruction and m.actor=a
    and exists(select 1 from public.os_threads th where th.id=m.thread_id and th.company_id=c1),'instruction is the person message in the company thread');
  select * into run from public.os_agent_runs where id=r1;
  perform pg_temp.ar_assert(run.priced=false and run.payer='local' and run.ceiling_usd=0 and run.cost_usd=0 and run.seq=0,'local run is unpriced with no ceiling');
  replay:=pg_temp.ar_start(r1,c1,a,instruction,'reply','local',1.00);
  perform pg_temp.ar_assert(replay->>'created'='false' and not (replay ? 'lease') and replay#>>'{run,id}'=r1::text,'same-id replay returns created false without a lease');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_start(gen_random_uuid(),%L,%L,%L,%L,%L,1)',c1,a,'Another run.','reply','local'),
    'P0001','agent_run_active','one open run per actor');
  started:=pg_temp.ar_start(rb,c1,b,'Prepare a follow-up for buyer one.','reply','local',1.00);
  perform pg_temp.ar_assert(started->>'created'='true','another member may run alongside');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_start(%L,%L,%L,%L,%L,%L,1)',pg_temp.ar_get('legacy_turn')->>'id',c1,a,'Collide.','reply','local'),
    '23514','agent run collision','a chat turn id cannot become a run');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_start(gen_random_uuid(),%L,%L,%L,%L,%L,1)',c1,a,'Bad format.','memo','local'),'P0001','agent_run_request','unknown format refused');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_start(gen_random_uuid(),%L,%L,%L,%L,%L,1)',c1,a,'Bad payer.','reply','free'),'P0001','agent_run_request','unknown payer refused');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_start(gen_random_uuid(),%L,%L,%L,%L,%L,6)',c1,a,'Too dear.','reply','platform'),'P0001','agent_run_request','cap above five refused');
  perform pg_temp.ar_rejected(format('select public.os_agent_run_start(gen_random_uuid(),%L,%L,%L,%L,%L,%L,1,100,0,30)',c1,a,'Short lease.','reply','local','local:x'),'P0001','agent_run_request','lease under a minute refused');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_start(gen_random_uuid(),%L,%L,%L,%L,%L,1)',c1,c,'Not my company.','reply','local'),'42501',null,'non-member cannot start');
  -- (2) A priced start needs ten cents of this month's budget; the ceiling is least(cap, remaining).
  n:=(select count(*) from public.os_review_turns);
  perform pg_temp.ar_rejected(format('select pg_temp.ar_start(%L,%L,%L,%L,%L,%L,1)',rc,c2,c,'Prepare follow-ups for the other company.','email','platform'),
    'P0001','agent_run_budget','priced start with five cents left refused');
  perform pg_temp.ar_assert((select count(*) from public.os_review_turns)=n and not exists(select 1 from public.os_agent_runs where id=rc),'refused start leaves no turn or run');
end; $$;
reset role;
update public.os_companies set monthly_chat_usd=0.60 where id='f81961af-922d-4d05-a001-000000000002';

set local role service_role;
do $$
declare
  c1 constant uuid:='f81961af-922d-4d05-a001-000000000001'; c2 constant uuid:='f81961af-922d-4d05-a001-000000000002';
  a constant uuid:='f81961af-922d-4d05-a002-000000000001'; b constant uuid:='f81961af-922d-4d05-a002-000000000002';
  c constant uuid:='f81961af-922d-4d05-a002-000000000003';
  r1 constant uuid:='f81961af-922d-4d05-a004-000000000001'; rb constant uuid:='f81961af-922d-4d05-a004-000000000002';
  rc constant uuid:='f81961af-922d-4d05-a004-000000000003';
  started jsonb; run public.os_agent_runs; x jsonb; reads jsonb:='{}'::jsonb; p jsonb; payload jsonb; result jsonb;
  seq_before integer; n integer; saved jsonb; item public.os_work_items; chat jsonb; proposals jsonb:='{}'::jsonb;
begin
  started:=pg_temp.ar_start(rc,c2,c,'Prepare follow-ups for the other company.','email','platform',1.00);
  select * into run from public.os_agent_runs where id=rc;
  perform pg_temp.ar_assert(run.priced and run.payer='platform' and run.ceiling_usd=0.60,'priced ceiling is least(cap, monthly remaining)');

  -- (3) Reads capture a company item, once per item; twelve distinct reads at most.
  x:=pg_temp.ar_read(r1,pg_temp.ar_item(1),'w1');
  perform pg_temp.ar_assert(x->>'created'='true' and x#>>'{read,title}'='Follow up with buyer 1' and x#>>'{read,lane}'='sales'
    and x#>>'{read,source_text}'=(select title||E'\n\n'||notes from public.os_work_items where id=pg_temp.ar_item(1))
    and (x#>>'{read,waiting_days}')::integer=8 and x->>'item_reads'='1','read captures title, lane, notes and waiting days, and says the run''s read count');
  reads:=reads||jsonb_build_object('w1',x->'read');
  seq_before:=(select seq from public.os_agent_runs where id=r1);
  result:=pg_temp.ar_read(r1,pg_temp.ar_item(1),'w1');
  perform pg_temp.ar_assert(result->>'created'='false' and result#>>'{read,id}'=x#>>'{read,id}' and result->>'item_reads'='1'
    and (select item_reads=1 and seq=seq_before from public.os_agent_runs where id=r1),'re-read returns the same capture without counting, and the count');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_read(%L,%L,%L)',r1,pg_temp.ar_item(1),'w2'),'23514','agent run read collision','one ref per captured item');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_read(%L,%L,%L)',r1,pg_temp.ar_item(99),'w2'),'P0001','agent_run_item_unavailable','another company''s item is unavailable');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_read(%L,%L,%L)',r1,pg_temp.ar_item(2),'x2'),'P0001','agent_run_request','malformed ref refused');
  for n in 2..12 loop
    x:=pg_temp.ar_read(r1,pg_temp.ar_item(n),'w'||n);
    reads:=reads||jsonb_build_object('w'||n,x->'read');
  end loop;
  perform pg_temp.ar_assert((reads#>>'{w2,waiting_days}')::integer=10,'waiting days round like os_needs_you (9.5 days is 10)');
  perform pg_temp.ar_assert((select item_reads from public.os_agent_runs where id=r1)=12,'twelve distinct reads counted');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_read(%L,%L,%L)',r1,pg_temp.ar_item(13),'w13'),'P0001','agent_run_read_limit','thirteenth distinct read refused');
  perform pg_temp.ar_assert((select count(*) from jsonb_array_elements_text(pg_temp.ar_kinds(r1)) k where k='read')=12,'each capture appends one read line');
  perform pg_temp.ar_put('r1_reads',reads);

  -- (4) A card cites [instruction, read:<capture>/title] and gets two sources.
  payload:=pg_temp.ar_card(r1,reads->'w1','Follow-up for buyer 1','Hello buyer 1, a gentle follow-up on invoice INV-101.');
  p:=pg_temp.ar_propose(r1,'f81961af-922d-4d05-a005-000000000001',reads->'w1',payload);
  perform pg_temp.ar_assert(p->>'created'='true' and p->>'cards'='1' and jsonb_array_length(p#>'{proposal,sources}')=2
    and p#>>'{proposal,sources,0,origin}'='founder' and p#>>'{proposal,sources,0,id}'=(select person_message_id::text from public.os_review_turns where id=r1)
    and p#>>'{proposal,sources,1,origin}'='record' and p#>>'{proposal,sources,1,id}'='read:'||(reads#>>'{w1,id}')
    and p#>>'{proposal,sources,1,text}'=reads#>>'{w1,source_text}'
    and p#>>'{proposal,sources,1,revision}'=encode(sha256(convert_to(reads#>>'{w1,source_text}','UTF8')),'hex'),'run card carries founder and record sources');
  perform pg_temp.ar_assert(p#>>'{proposal,status}'='proposed' and p#>>'{proposal,turn_id}'=r1::text,'a run card is an ordinary proposal on the run turn');
  seq_before:=(select seq from public.os_agent_runs where id=r1);
  result:=pg_temp.ar_propose(r1,'f81961af-922d-4d05-a005-000000000001',reads->'w1',payload);
  perform pg_temp.ar_assert(result->>'created'='false' and result#>>'{proposal,id}'=p#>>'{proposal,id}' and result->>'cards'='1'
    and (select cards=1 and seq=seq_before from public.os_agent_runs where id=r1),'planned id replays without counting a card, and says the count');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_propose(%L,gen_random_uuid(),%L::jsonb,%L::jsonb)',r1,reads->'w1',
    pg_temp.ar_card(r1,reads->'w1','Again','Hello again buyer 1.')),'P0001','agent_run_item_carded','one card per capture');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_propose(%L,gen_random_uuid(),%L::jsonb,%L::jsonb)',r1,reads->'w2',
    jsonb_set(pg_temp.ar_card(r1,reads->'w2','T','B two.'),'{citations}',(pg_temp.ar_card(r1,reads->'w2','T','B two.')->'citations')-1)),
    'P0001','agent_run_citations','the record citation is required');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_propose(%L,gen_random_uuid(),%L::jsonb,%L::jsonb)',r1,reads->'w2',
    jsonb_set(pg_temp.ar_card(r1,reads->'w2','T','B two.'),'{citations,1,quote}','"Follow up"')),
    'P0001','agent_run_citations','the record quote is exactly the capture title');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_propose(%L,gen_random_uuid(),%L::jsonb,%L::jsonb)',r1,reads->'w2',
    jsonb_set(pg_temp.ar_card(r1,reads->'w2','T','B two.'),'{lane}','"finance"')),
    'P0001','agent_run_citations','the lane is the capture''s');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_propose(%L,gen_random_uuid(),%L::jsonb,%L::jsonb)',r1,reads->'w2',
    pg_temp.ar_card(r1,reads->'w2','T','B two as a note.','note')),'P0001','review_draft_format','a card in another format is refused by the validator');
  for n in 2..8 loop
    p:=pg_temp.ar_propose(r1,('f81961af-922d-4d05-a005-'||lpad(n::text,12,'0'))::uuid,reads->('w'||n),
      pg_temp.ar_card(r1,reads->('w'||n),'Follow-up for buyer '||n,'Hello buyer '||n||', a gentle follow-up on invoice INV-'||(100+n)||'.'));
    proposals:=proposals||jsonb_build_object('w'||n,p->'proposal');
  end loop;
  perform pg_temp.ar_assert((select cards from public.os_agent_runs where id=r1)=8,'eight cards staged');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_propose(%L,gen_random_uuid(),%L::jsonb,%L::jsonb)',r1,reads->'w9',
    pg_temp.ar_card(r1,reads->'w9','Follow-up 9','Hello buyer 9.')),'P0001','agent_run_card_limit','ninth card refused');
  perform pg_temp.ar_put('r1_proposals',proposals||jsonb_build_object('w1',(select to_jsonb(op) from public.os_review_proposals op where id='f81961af-922d-4d05-a005-000000000001')));

  -- A chat turn cannot cite a capture; another run's turn cannot cite this run's capture.
  chat:=public.os_review_begin(gen_random_uuid(),c1,a,'Draft a reply about crates.','draft',jsonb_build_object('draftFormat','reply','knowledgeAssertion',null))->'turn';
  perform pg_temp.ar_rejected(format('select public.os_review_propose(gen_random_uuid(),%L,%L,%L,%L::jsonb)',chat->>'id',c1,a,
    jsonb_build_object('type','work','title','Crates','body','Crates reply citing a capture.','lane','sales','kind','reply','outwardAction','send',
      'citations',jsonb_build_array(jsonb_build_object('sourceId',chat->>'person_message_id','quote','Draft a reply'),
        jsonb_build_object('sourceId','read:'||(reads#>>'{w1,id}'),'quote',reads#>>'{w1,title}')))),
    '23514','review citation does not match founder source','a chat turn cannot cite a run capture');
  perform pg_temp.ar_rejected(format('select public.os_review_propose(gen_random_uuid(),%L,%L,%L,%L::jsonb)',rb,c1,b,
    pg_temp.ar_card(rb,reads->'w1','Borrowed','Borrowed capture body.')),
    '23514','review citation does not match a record this run read','another run''s capture is refused by the validator');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_propose(%L,gen_random_uuid(),%L::jsonb,%L::jsonb)',rb,reads->'w1',
    pg_temp.ar_card(rb,reads->'w1','Borrowed','Borrowed capture body.')),'P0001','agent_run_read_required','a run may only card its own captures');
  perform pg_temp.ar_put('chat_turn',chat);

  -- (6, amendment) The person saves a card while the run still works; captures keep Save valid after an item edit.
  saved:=pg_temp.ar_decide(proposals->'w3','save_to_work');
  perform pg_temp.ar_assert(saved->>'status'='saved','a run card saves while the run is open');
  select * into item from public.os_work_items where id=(saved->>'record_id')::uuid;
  perform pg_temp.ar_assert(item.status='drafted' and item.required_action='send' and item.kind='reply' and item.lane='sales'
    and jsonb_array_length(item.sources)=2 and item.sources->1->>'origin'='record' and item.sources->1->>'id'='read:'||(reads#>>'{w3,id}')
    and item.metadata#>>'{review,turnId}'=r1::text and item.metadata->>'by'='cofounder','saved Work keeps both sources and the run turn');
  update public.os_work_items set title='Follow up with buyer 4 (renamed)' where id=pg_temp.ar_item(4);
  saved:=pg_temp.ar_decide(proposals->'w4','save_to_work');
  perform pg_temp.ar_assert(saved->>'status'='saved','a capture keeps Save valid after the cited item changes');
  perform pg_temp.ar_assert(pg_temp.ar_decide(proposals->'w5','dismiss')->>'status'='dismissed','a run card can be dismissed mid-run');
  perform pg_temp.ar_assert((select count(*) from public.os_approvals ap join public.os_work_items w on w.id=ap.item_id where w.company_id=c1)=0,'no approval exists');

  -- (7, amendment) Revise keeping the citations; a replay of the planned id then returns the person's revision.
  payload:=jsonb_set(jsonb_set(proposals#>'{w2,payload}','{title}','"Follow-up for buyer 2, edited"'),'{body}','"Hello buyer 2, edited by the person."');
  saved:=pg_temp.ar_decide(proposals->'w2','revise',payload);
  perform pg_temp.ar_assert(saved->>'revision'='2' and jsonb_array_length(saved->'sources')=2,'revise keeping citations succeeds');
  result:=pg_temp.ar_propose(r1,'f81961af-922d-4d05-a005-000000000002',reads->'w2',proposals#>'{w2,payload}');
  perform pg_temp.ar_assert(result->>'created'='false' and result#>>'{proposal,revision}'='2'
    and result#>>'{proposal,payload,title}'='Follow-up for buyer 2, edited','replay after a person''s edit is a read, not a collision');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_decide(%L::jsonb,%L,%L::jsonb)',saved,'revise',
    jsonb_set(payload,'{citations}',(payload->'citations')-1)),'23514','review citation does not match founder source','revise dropping the record citation refused');
  perform pg_temp.ar_rejected(format('select public.os_agent_run_propose(%L,%L,%L,%L,%L,%L,%L::jsonb)',r1,c1,a,
    (select lease_id from public.os_agent_runs where id=r1),pg_temp.ar_get('legacy_proposal')->>'id',reads#>>'{w9,id}',
    pg_temp.ar_card(r1,reads->'w9','T','B nine.')),'23514','agent run proposal collision','a planned id naming another turn''s proposal collides');
end; $$;

-- (5) The open-card rule: a later run on the same item waits for the earlier card's decision.
do $$
declare
  c1 constant uuid:='f81961af-922d-4d05-a001-000000000001';
  rb constant uuid:='f81961af-922d-4d05-a004-000000000002'; y jsonb; p jsonb;
begin
  y:=pg_temp.ar_read(rb,pg_temp.ar_item(1),'w1');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_propose(%L,gen_random_uuid(),%L::jsonb,%L::jsonb)',rb,y->'read',
    pg_temp.ar_card(rb,y->'read','Second follow-up','A second follow-up for buyer one.')),'P0001','agent_run_open_card','an undecided earlier run card blocks the item');
  perform pg_temp.ar_assert(pg_temp.ar_decide(pg_temp.ar_get('r1_proposals')->'w1','dismiss')->>'status'='dismissed','earlier card dismissed by its starter');
  p:=pg_temp.ar_propose(rb,'f81961af-922d-4d05-a005-000000000011',y->'read',pg_temp.ar_card(rb,y->'read','Second follow-up','A second follow-up for buyer one.'));
  perform pg_temp.ar_assert(p->>'created'='true','the item may be carded again once the earlier card is decided');
  perform pg_temp.ar_put('rb_lease',to_jsonb((select lease_id from public.os_agent_runs where id=rb)));
end; $$;

-- (8) Fences: a wrong lease or seq is fenced.
do $$
declare r1 constant uuid:='f81961af-922d-4d05-a004-000000000001'; rd jsonb:=pg_temp.ar_get('r1_reads');
begin
  perform pg_temp.ar_rejected(format('select pg_temp.ar_step(%L,%L::jsonb,gen_random_uuid())',r1,'{"checkpoint":{}}'),'P0001','agent_run_fenced','step with a wrong lease is fenced');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_step(%L,%L::jsonb,null,0)',r1,'{"checkpoint":{}}'),'P0001','agent_run_fenced','step with a stale seq is fenced');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_round(%L,0,100,gen_random_uuid())',r1),'P0001','agent_run_fenced','round with a wrong lease is fenced');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_round(%L,0,100,null,0)',r1),'P0001','agent_run_fenced','round with a stale seq is fenced');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_read(%L,%L,%L,gen_random_uuid())',r1,pg_temp.ar_item(13),'w13'),'P0001','agent_run_fenced','read with a wrong lease is fenced');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_propose(%L,gen_random_uuid(),%L::jsonb,%L::jsonb,gen_random_uuid())',r1,rd->'w9',
    pg_temp.ar_card(r1,rd->'w9','T','B nine.')),'P0001','agent_run_fenced','propose with a wrong lease is fenced');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_resume(%L,%L)',r1,'continue'),'P0001','agent_run_not_resumable','a live lease cannot be continued');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_resume(%L,%L,null,0)',r1,'continue'),'P0001','agent_run_stale','a stale tab is told so');
end; $$;
reset role;
-- The function holding the lease dies: the lease expires. (Sequenced, as the guard requires.)
update public.os_agent_runs set lease_until=clock_timestamp()-interval '1 second',seq=seq+1 where id='f81961af-922d-4d05-a004-000000000002';
set local role service_role;
do $$
declare rb constant uuid:='f81961af-922d-4d05-a004-000000000002'; old_lease uuid:=(pg_temp.ar_get('rb_lease')#>>'{}')::uuid; resumed jsonb;
begin
  perform pg_temp.ar_rejected(format('select pg_temp.ar_round(%L,0)',rb),'P0001','agent_run_fenced','an expired lease is fenced');
  resumed:=pg_temp.ar_resume(rb,'continue');
  perform pg_temp.ar_assert(resumed->>'lease' is not null and (resumed->>'lease')::uuid<>old_lease and resumed#>>'{run,slices}'='2'
    and pg_temp.ar_kinds(rb)->>-1='resumed','continue on a stalled run issues a new lease');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_step(%L,%L::jsonb,%L)',rb,'{"checkpoint":{}}',old_lease),'P0001','agent_run_fenced','the old lease is fenced after continue');
  perform pg_temp.ar_assert(pg_temp.ar_step(rb,'{"checkpoint":{"v":1}}')->>'status'='running','the new lease steps');
end; $$;

-- (9) Rounds and usage: once per round, in any status; twelve rounds at most.
do $$
declare r1 constant uuid:='f81961af-922d-4d05-a004-000000000001'; rb constant uuid:='f81961af-922d-4d05-a004-000000000002';
  result jsonb; n integer;
begin
  result:=pg_temp.ar_round(r1,0);
  perform pg_temp.ar_assert(result->>'go'='true' and result->>'round'='1','a local round reserves round one');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_round(%L,0.01)',r1),'23514','invalid agent run projection','an unpriced run projects nothing');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_round(%L,0,-1)',r1),'23514','invalid agent run projection','a negative daily cap is invalid');
  result:=public.os_agent_run_usage(r1,1,1200,80,0);
  perform pg_temp.ar_assert(result->>'recorded'='true' and (select input_tokens=1200 and output_tokens=80 and cost_usd=0 from public.os_agent_runs where id=r1),'usage recorded once');
  result:=public.os_agent_run_usage(r1,1,1200,80,0);
  perform pg_temp.ar_assert(result->>'recorded'='false' and (select input_tokens from public.os_agent_runs where id=r1)=1200,'second usage for a round is ignored');
  perform pg_temp.ar_rejected(format('select public.os_agent_run_usage(%L,1,10,10,0.01)',r1),'23514','invalid agent run usage','an unpriced run records no cost');
  perform pg_temp.ar_rejected(format('select public.os_agent_run_usage(%L,2,10,10,0)',r1),'23514','invalid agent run usage','usage only for a reserved round');
  for n in 2..12 loop
    result:=pg_temp.ar_round(r1,0);
    perform public.os_agent_run_usage(r1,n,1000,50,0);
  end loop;
  result:=pg_temp.ar_round(r1,0);
  perform pg_temp.ar_assert(result->>'go'='false' and result->>'stop'='step_limit' and (select rounds from public.os_agent_runs where id=r1)=12,'no thirteenth round');
  perform pg_temp.ar_assert((select count(*) from public.os_agent_run_usage where run_id=r1)=12,'twelve ledger rows');
  -- A round in flight for the stalled-then-continued run: Stop below charges it at its hold.
  perform pg_temp.ar_round(rb,0);
end; $$;

-- (10) Stop: the actor only; the run and its turn close at once; a call in flight is charged at its hold.
do $$
declare c1 constant uuid:='f81961af-922d-4d05-a001-000000000001'; a constant uuid:='f81961af-922d-4d05-a002-000000000001';
  b constant uuid:='f81961af-922d-4d05-a002-000000000002'; rb constant uuid:='f81961af-922d-4d05-a004-000000000002';
  r1 constant uuid:='f81961af-922d-4d05-a004-000000000001';
  result jsonb; t public.os_review_turns; lease uuid:=(select lease_id from public.os_agent_runs where id=rb); y jsonb;
begin
  perform pg_temp.ar_rejected(format('select public.os_agent_run_cancel(%L,%L,%L)',rb,c1,a),'42501','agent run unavailable','another member cannot stop the run');
  result:=public.os_agent_run_cancel(rb,c1,b);
  perform pg_temp.ar_assert(result#>>'{run,status}'='canceled' and result#>>'{run,stop_reason}'='canceled' and result#>'{run,lease_until}'='null'::jsonb
    and pg_temp.ar_kinds(rb)->>-1='stopped','stop closes the run');
  select * into t from public.os_review_turns where id=rb;
  perform pg_temp.ar_assert(t.status='failed' and t.reply like 'Run stopped by the member who started it.%'
    and t.reply like '%cards prepared: 1 (waiting for a decision: 1; saved to Work by the member who started the run: 0; dismissed by that member: 0)%'
    and t.reply like '%saved, approved, sent and published nothing%','stop closes the turn with a receipt counted from the cards');
  perform pg_temp.ar_assert((select cost_usd=0 and input_tokens=0 from public.os_messages where id=t.reply_message_id),'the stop message carries no cost');
  perform pg_temp.ar_assert(public.os_agent_run_cancel(rb,c1,b)#>>'{run,seq}'=result#>>'{run,seq}','stop is idempotent');
  perform pg_temp.ar_assert((select estimated and cost_usd=0 from public.os_agent_run_usage where run_id=rb and round=1),
    'stop charges the round in flight at its hold, marked estimated');
  result:=public.os_agent_run_usage(rb,1,500,20,0);
  perform pg_temp.ar_assert(result->>'recorded'='false'
    and (select input_tokens from public.os_agent_runs where id=rb)=0,'a late report of a round already charged at its hold is ignored');
  y:=pg_temp.ar_read(r1,pg_temp.ar_item(1),'w1');
  perform pg_temp.ar_rejected(format('select public.os_agent_run_propose(%L,%L,%L,%L,gen_random_uuid(),%L,%L::jsonb)',rb,c1,b,lease,y#>>'{read,id}',
    pg_temp.ar_card(rb,y->'read','After stop','Body after stop.')),'P0001','agent_run_fenced','nothing stages after stop');
  perform pg_temp.ar_rejected(format('select public.os_review_interrupt(%L,%L,%L)',rb,c1,b),'P0001','agent_run_cancel_instead','a run turn is not interrupted, it is stopped');
  perform pg_temp.ar_rejected(format('select public.os_review_interrupt(%L,%L,%L)',r1,c1,a),'P0001','agent_run_cancel_instead','an open run turn is not interrupted either');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_resume(%L,%L)',rb,'continue'),'P0001','agent_run_not_resumable','a stopped run cannot continue');
end; $$;

-- (11) Waiting: one question, then the answer resumes the run.
do $$
declare rc constant uuid:='f81961af-922d-4d05-a004-000000000003'; result jsonb; run public.os_agent_runs;
  question constant jsonb:='{"to":"waiting","question":{"text":"Which contact should the email address?","why":"Two contacts are listed.","options":["Selin","Deniz"]}}';
begin
  perform pg_temp.ar_rejected(format('select pg_temp.ar_step(%L,%L::jsonb)',rc,
    jsonb_build_object('checkpoint','{}'::jsonb,'transition',jsonb_set(question,'{question,options}','["a","b","c","d"]'))),'23514','invalid agent run question','at most three options');
  result:=pg_temp.ar_step(rc,jsonb_build_object('checkpoint',jsonb_build_object('v',1,'awaiting',jsonb_build_object('toolUseId','ask-1')),
    'transition',question,'progress','[{"k":"asked"}]'::jsonb));
  select * into run from public.os_agent_runs where id=rc;
  perform pg_temp.ar_assert(result->>'status'='waiting' and run.status='waiting' and run.lease_id is null and run.asked
    and run.question->>'text'='Which contact should the email address?','a waiting transition stores the question and clears the lease');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_resume(%L,%L)',rc,'continue'),'P0001','agent_run_not_resumable','a waiting run is answered, not continued');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_resume(%L,%L,%L)',rc,'answer',' '),'P0001','agent_run_request','an empty answer is refused');
  result:=pg_temp.ar_resume(rc,'answer','Selin, please.');
  select * into run from public.os_agent_runs where id=rc;
  perform pg_temp.ar_assert(run.status='running' and run.answer='Selin, please.' and run.answered_at is not null and run.lease_id is not null
    and pg_temp.ar_kinds(rc)->>-1='answered','answer resumes the run');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_step(%L,%L::jsonb)',rc,jsonb_build_object('checkpoint','{}'::jsonb,'transition',question)),
    'P0001','agent_run_already_asked','a run asks once');
end; $$;

-- Budget: the projection stops the run for budget instead of raising; a real call is ledgered whatever it cost.
do $$
declare rc constant uuid:='f81961af-922d-4d05-a004-000000000003'; result jsonb;
begin
  result:=pg_temp.ar_round(rc,0.70);
  perform pg_temp.ar_assert(result->>'go'='false' and result->>'stop'='budget','a projection above the ceiling stops for budget');
  result:=pg_temp.ar_round(rc,6);
  perform pg_temp.ar_assert(result->>'go'='false' and result->>'stop'='budget','a projection above five is a budget stop, not an error');
  result:=pg_temp.ar_round(rc,0.10,5);
  perform pg_temp.ar_assert(result->>'go'='true' and result->>'round'='1','an affordable round is reserved');
  result:=public.os_agent_run_usage(rc,1,1000,100,0.0075);
  perform pg_temp.ar_assert(result->>'recorded'='true'
    and (select cost_usd from public.os_agent_runs where id=rc)=0.0075,'priced usage accumulates on the run');
  perform pg_temp.ar_rejected(format('select public.os_agent_run_usage(%L,1,100,0,0.5)',rc),'23514','invalid agent run usage','cost above the dearest permitted price is refused');
end; $$;
reset role;

-- Month boundary (amendment): a run begun last month that spends this month is counted this month.
insert into public.os_runs(user_id,topic,cost_usd,company_id,created_at) values
 ('f81961af-922d-4d05-a002-000000000003','Fictional workflow run',1.50,'f81961af-922d-4d05-a001-000000000002',now());
set local role service_role;
do $$
declare c1 constant uuid:='f81961af-922d-4d05-a001-000000000001'; d constant uuid:='f81961af-922d-4d05-a002-000000000004';
  rm constant uuid:='f81961af-922d-4d05-a004-000000000004'; chat jsonb:=pg_temp.ar_get('chat_turn');
begin
  perform public.os_review_begin(rm,c1,d,'Prepare follow-ups started on the last day of the month.','draft',jsonb_build_object('draftFormat','reply','knowledgeAssertion',null));
  -- A chat answer that cost money this month, written the way the chat route writes it.
  perform public.os_review_finish((chat->>'id')::uuid,c1,(chat->>'actor_id')::uuid,'A chat answer.','completed',100,10,0.25);
end; $$;
reset role;
insert into public.os_agent_runs(id,company_id,actor_id,payer,priced,model_label,ceiling_usd,lease_id,lease_until,rounds,created_at)
values ('f81961af-922d-4d05-a004-000000000004','f81961af-922d-4d05-a001-000000000001','f81961af-922d-4d05-a002-000000000004',
  'company',true,'anthropic:fixture',1.00,'f81961af-922d-4d05-a006-000000000001',clock_timestamp()+interval '10 minutes',2,
  date_trunc('month',now())-interval '2 hours');
insert into public.os_agent_run_rounds(run_id,round,company_id,hold_usd,reserved_at) values
 ('f81961af-922d-4d05-a004-000000000004',1,'f81961af-922d-4d05-a001-000000000001',0.40,date_trunc('month',now())-interval '1 hour'),
 ('f81961af-922d-4d05-a004-000000000004',2,'f81961af-922d-4d05-a001-000000000001',0.30,now());
insert into public.os_agent_run_usage(run_id,round,company_id,input_tokens,output_tokens,cost_usd,recorded_at) values
 ('f81961af-922d-4d05-a004-000000000004',1,'f81961af-922d-4d05-a001-000000000001',1000,100,0.40,date_trunc('month',now())-interval '1 hour'),
 ('f81961af-922d-4d05-a004-000000000004',2,'f81961af-922d-4d05-a001-000000000001',1000,100,0.30,now());
update public.os_companies set monthly_chat_usd=0.60 where id='f81961af-922d-4d05-a001-000000000001';
set local role service_role;
do $$
declare c1 constant uuid:='f81961af-922d-4d05-a001-000000000001'; c2 constant uuid:='f81961af-922d-4d05-a001-000000000002';
  rm constant uuid:='f81961af-922d-4d05-a004-000000000004'; rc constant uuid:='f81961af-922d-4d05-a004-000000000003';
  lease constant uuid:='f81961af-922d-4d05-a006-000000000001'; result jsonb;
begin
  perform pg_temp.ar_assert(internal.os_agent_month_spend(c1)=0.55,'month spend counts this month''s messages and ledger rows by their own timestamps');
  perform pg_temp.ar_assert(internal.os_agent_month_spend(c2)=0.0075,'month spend is per company');
  -- 0.25 + 0.30 + 0.10 > 0.60: counting the run by created_at would have said 0.35 and gone ahead.
  result:=public.os_agent_run_round(rm,c1,'f81961af-922d-4d05-a002-000000000004',lease,0,0.10,100);
  perform pg_temp.ar_assert(result->>'go'='false' and result->>'stop'='month_budget','the run''s own spend this month counts against this month, and says so');

  -- Daily cap (amendment): a company key is checked against the company's day, the platform key against the platform's:
  -- every workflow run, and the runs on the platform's key. rm's 0.30 today is on company one's own key.
  perform pg_temp.ar_assert(internal.os_agent_day_spend(c1)=0.30 and internal.os_agent_day_spend(c2)=1.5075
    and internal.os_agent_day_spend(null)=1.5075,'day spend is os_runs plus run rounds reserved today; the platform''s day leaves out a company''s own key');
  perform pg_temp.ar_assert(public.os_spent_today(c1)=0.30 and public.os_spent_today(null)=1.5075,
    'the worker and the manual run read the same day total runs are checked against');
end; $$;
reset role;
update public.os_companies set monthly_chat_usd=5 where id='f81961af-922d-4d05-a001-000000000001';
set local role service_role;
do $$
declare c1 constant uuid:='f81961af-922d-4d05-a001-000000000001'; d constant uuid:='f81961af-922d-4d05-a002-000000000004';
  rm constant uuid:='f81961af-922d-4d05-a004-000000000004'; rc constant uuid:='f81961af-922d-4d05-a004-000000000003';
  lease constant uuid:='f81961af-922d-4d05-a006-000000000001'; result jsonb;
begin
  result:=public.os_agent_run_round(rm,c1,d,lease,0,0.10,0.35);
  perform pg_temp.ar_assert(result->>'go'='false' and result->>'stop'='daily_cap','a company-key round over the daily cap stops at the daily cap');
  result:=public.os_agent_run_round(rm,c1,d,lease,0,0.10,0.45);
  perform pg_temp.ar_assert(result->>'go'='true' and result->>'round'='3','another company''s workflow spend does not count against a company key');
  result:=pg_temp.ar_round(rc,0.10,1.55);
  perform pg_temp.ar_assert(result->>'go'='false' and result->>'stop'='daily_cap','a platform-key round counts every company''s workflow and platform-key spend today');
  -- 1.5075 + 0.10 fits 1.65; counting company one's own-key 0.30 and its 0.10 in flight would have said 2.0075 and stopped.
  result:=pg_temp.ar_round(rc,0.10,1.65);
  perform pg_temp.ar_assert(result->>'go'='true','under the daily cap the platform round goes ahead: another company''s own-key spend is not the platform''s');
  perform public.os_agent_run_cancel(rm,c1,d);
end; $$;

-- (12, amendment) Finish: one message at cost 0, its receipt counted from the cards as they stand now.
do $$
declare c1 constant uuid:='f81961af-922d-4d05-a001-000000000001'; a constant uuid:='f81961af-922d-4d05-a002-000000000001';
  r1 constant uuid:='f81961af-922d-4d05-a004-000000000001'; result jsonb; again jsonb; t public.os_review_turns; m public.os_messages;
begin
  perform pg_temp.ar_rejected(format('select pg_temp.ar_finish(%L,%L,%L,%L)',r1,'completed','provider','x'),'23514','invalid agent run completion','a completed run cannot claim a provider failure');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_finish(%L,%L,%L,%L)',r1,'completed','done',repeat('x',4001)),'23514','invalid agent run completion','model text is bounded');
  result:=pg_temp.ar_finish(r1,'completed','done','I prepared eight follow-ups; buyer nine is left for later.',2,1);
  perform pg_temp.ar_assert(result#>>'{run,status}'='completed' and result#>>'{run,stop_reason}'='done' and result#>'{run,lease_until}'='null'::jsonb
    and pg_temp.ar_kinds(r1)->>-1='finished','finish closes the run with a finished line');
  select * into t from public.os_review_turns where id=r1;
  select * into m from public.os_messages where id=t.reply_message_id;
  perform pg_temp.ar_assert(t.status='completed' and m.role='cofounder' and m.cost_usd=0 and m.input_tokens=0 and m.output_tokens=0
    and (select count(*) from public.os_messages om where om.thread_id=t.thread_id and om.role='cofounder' and om.body=t.reply)=1,'one co-founder message at cost 0');
  perform pg_temp.ar_assert(t.reply like 'I prepared eight follow-ups; buyer nine is left for later.%','the model''s text leads the reply');
  perform pg_temp.ar_assert(t.reply like '%Run receipt — cards prepared: 8 (waiting for a decision: 4; saved to Work by the member who started the run: 2; dismissed by that member: 2).%',
    'the receipt says which cards the person saved and dismissed while the run worked');
  perform pg_temp.ar_assert(t.reply not like '%Ready for review; not saved%' and t.reply like '%The run itself saved, approved, sent and published nothing.%','no untrue not-saved line');
  perform pg_temp.ar_assert(t.reply like '%Model steps: 12 of at most 12; records read: 12; stopped: it finished.%'
    and t.reply like '%Refused attempts during the run: 2.%' and t.reply like '%Model replies set aside unused: 1.%','the receipt carries steps, reads and the driver''s counters');
  again:=pg_temp.ar_finish(r1,'failed','provider','late');
  perform pg_temp.ar_assert(again#>>'{run,status}'='completed' and again#>>'{run,seq}'=result#>>'{run,seq}','a second finish returns the run unchanged');
end; $$;

-- (11) Skip, (amendment) a storage stop that finishes failed with a 'failed' line, and step validation.
do $$
declare c1 constant uuid:='f81961af-922d-4d05-a001-000000000001'; a constant uuid:='f81961af-922d-4d05-a002-000000000001';
  r2 constant uuid:='f81961af-922d-4d05-a004-000000000005'; result jsonb; run public.os_agent_runs; t public.os_review_turns;
begin
  perform pg_temp.ar_start(r2,c1,a,'Prepare a decision record for the blocked items.','decision','local',1.00);
  perform pg_temp.ar_rejected(format('select pg_temp.ar_step(%L,%L::jsonb)',r2,'{"checkpoint":{},"progress":[{"k":"refused","n":1},{"k":"refused","n":2}]}'),
    '23514','invalid agent run progress','one refused line per step');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_step(%L,%L::jsonb)',r2,'{"checkpoint":{},"progress":[{"k":"card","label":"forged"}]}'),
    '23514','invalid agent run progress','the driver cannot write a card line');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_step(%L,%L::jsonb)',r2,'{"checkpoint":{},"extra":true}'),'23514','invalid agent run step','unknown step keys refused');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_step(%L,%L::jsonb)',r2,jsonb_build_object('checkpoint',jsonb_build_object('pad',repeat('x',400001))))
    ,'23514',null,'an oversized checkpoint is refused by storage');
  result:=pg_temp.ar_step(r2,'{"checkpoint":{"v":1},"plan":{"steps":["Find blocked items","Read them","Draft decisions"],"refs":["w1","w2"]},"progress":[{"k":"plan","n":3},{"k":"refused","n":3}]}');
  select * into run from public.os_agent_runs where id=r2;
  perform pg_temp.ar_assert(run.plan#>>'{steps,0}'='Find blocked items' and pg_temp.ar_kinds(r2)=jsonb_build_array('plan','refused')
    and (run.progress->1->>'n')::integer=3 and run.progress->0 ? 'at','plan and one counted refusal recorded with SQL time');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_step(%L,%L::jsonb)',r2,'{"checkpoint":{},"plan":{"steps":["Again"],"refs":[]}}'),'P0001','agent_run_plan_once','the plan is set once');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_step(%L,%L::jsonb)',r2,'{"checkpoint":{},"transition":{"to":"done"}}'),'23514','invalid agent run transition','unknown transition refused');
  result:=pg_temp.ar_step(r2,'{"checkpoint":{"v":1,"awaiting":{"toolUseId":"ask-1"}},"transition":{"to":"waiting","question":{"text":"Which decision first?","why":null,"options":[]}}}');
  result:=pg_temp.ar_resume(r2,'skip');
  select * into run from public.os_agent_runs where id=r2;
  perform pg_temp.ar_assert(run.status='running' and run.answer is null and run.answered_at is not null and pg_temp.ar_kinds(r2)->>-1='skipped','skip resumes without an answer');
  result:=pg_temp.ar_step(r2,'{"checkpoint":{"v":1},"transition":{"to":"paused"},"progress":[{"k":"paused"}]}');
  perform pg_temp.ar_assert(result->>'status'='paused' and (select lease_id is null from public.os_agent_runs where id=r2),'a paused transition clears the lease');
  perform pg_temp.ar_resume(r2,'continue');
  result:=pg_temp.ar_finish(r2,'failed','storage','');
  select * into t from public.os_review_turns where id=r2;
  perform pg_temp.ar_assert(result#>>'{run,status}'='failed' and result#>>'{run,stop_reason}'='storage' and pg_temp.ar_kinds(r2)->>-1='failed'
    and t.status='failed' and t.reply like '[Interrupted: this answer is incomplete. Review stored suggestions separately.]%'
    and t.reply like '%The run stopped before its first model step.%' and t.reply not like '%The model gave no summary%'
    and t.reply like '%Run receipt — this run prepared no cards.%'
    and t.reply like '%stopped: storage refused a step, so it stopped.%','a storage stop finishes failed with a failed line, not finished');
end; $$;
reset role;

-- (16, amendment) Holds. A round counts at its projection until its call reports, so two members'
-- rounds cannot both spend the same remaining money; a round whose call never reports (Stop, a
-- timeout, a lost response, a dead function) is charged at its hold before the next round and at
-- the end. Then: a start the day or the month cannot cover, a stop before the first model step,
-- Stop's receipt counters, and giving a lease up.
insert into auth.users(id,email) values
 ('f81961af-922d-4d05-a002-000000000005','runs-holds-owner@example.invalid'),
 ('f81961af-922d-4d05-a002-000000000006','runs-holds-member@example.invalid');
insert into public.os_companies(id,name,monthly_chat_usd) values ('f81961af-922d-4d05-a001-000000000003','Fictional holds company',1.00);
insert into public.os_company_members(company_id,user_id,role) values
 ('f81961af-922d-4d05-a001-000000000003','f81961af-922d-4d05-a002-000000000005','owner'),
 ('f81961af-922d-4d05-a001-000000000003','f81961af-922d-4d05-a002-000000000006','member');
insert into public.os_threads(id,company_id) values ('f81961af-922d-4d05-a007-000000000001','f81961af-922d-4d05-a001-000000000003');
insert into public.os_messages(thread_id,role,body,cost_usd) values ('f81961af-922d-4d05-a007-000000000001','cofounder','Earlier chat this month.',0.85);
set local role service_role;
do $$
declare c3 constant uuid:='f81961af-922d-4d05-a001-000000000003';
  e constant uuid:='f81961af-922d-4d05-a002-000000000005'; f constant uuid:='f81961af-922d-4d05-a002-000000000006';
  re constant uuid:='f81961af-922d-4d05-a004-000000000007'; rf constant uuid:='f81961af-922d-4d05-a004-000000000008';
  rz constant uuid:='f81961af-922d-4d05-a004-000000000009'; rl constant uuid:='f81961af-922d-4d05-a004-00000000000a';
  result jsonb; t public.os_review_turns; old_lease uuid;
begin
  perform pg_temp.ar_start(re,c3,e,'Prepare follow-ups for the holds company.','reply','platform',1.00);
  perform pg_temp.ar_start(rf,c3,f,'Prepare a follow-up for the second member.','reply','platform',1.00);
  perform pg_temp.ar_assert((select bool_and(ceiling_usd=0.15) from public.os_agent_runs where id in (re,rf)),'both ceilings are the month''s fifteen cents');
  result:=pg_temp.ar_round(re,0.14);
  perform pg_temp.ar_assert(result->>'go'='true' and internal.os_agent_month_spend(c3)=0.99,'a reserved round counts at its hold at once');
  result:=pg_temp.ar_round(rf,0.14);
  perform pg_temp.ar_assert(result->>'go'='false' and result->>'stop'='month_budget','a second member''s round sees the first one''s call in flight');
  result:=public.os_agent_run_usage(re,1,1000,100,0.01);
  perform pg_temp.ar_assert(result->>'recorded'='true' and internal.os_agent_month_spend(c3)=0.86
    and (select not estimated from public.os_agent_run_usage where run_id=re and round=1),'the call''s own usage replaces its hold');
  perform pg_temp.ar_assert(pg_temp.ar_round(rf,0.10)->>'go'='true' and pg_temp.ar_round(re,0.03)->>'go'='true','both members'' next rounds fit');
  -- Stop while f's call is in flight: charged at its hold; its late report is ignored. Stop's receipt
  -- carries the counters of the last checkpoint, as a finish would.
  perform pg_temp.ar_step(rf,'{"checkpoint":{"v":1,"counters":{"refused":2,"faults":1,"cutOffs":1,"searches":0}}}');
  result:=public.os_agent_run_cancel(rf,c3,f);
  perform pg_temp.ar_assert(result#>>'{run,cost_usd}'='0.100000'
    and (select estimated and cost_usd=0.10 from public.os_agent_run_usage where run_id=rf and round=1),'stop charges the call in flight at its hold');
  perform pg_temp.ar_assert(public.os_agent_run_usage(rf,1,800,40,0.02)->>'recorded'='false'
    and (select cost_usd from public.os_agent_runs where id=rf)=0.10,'its late report does not replace the charged hold');
  select * into t from public.os_review_turns where id=rf;
  perform pg_temp.ar_assert(t.reply like '%Refused attempts during the run: 2.%' and t.reply like '%Model replies set aside unused: 2.%',
    'stop''s receipt counts refusals, faults and cut-offs from the checkpoint');
  -- e's round 2 never reports (its response was lost twice): the next round charges it at its hold.
  result:=pg_temp.ar_round(re,0.01);
  perform pg_temp.ar_assert(result->>'go'='true' and result->>'round'='3'
    and (select estimated and cost_usd=0.03 and input_tokens=0 from public.os_agent_run_usage where run_id=re and round=2)
    and (select cost_usd from public.os_agent_runs where id=re)=0.04,'a round that never reported is charged at its hold before the next');
  perform pg_temp.ar_assert(public.os_agent_run_usage(re,2,10,1,0.001)->>'recorded'='false','a late report of a charged round is ignored');
  perform pg_temp.ar_assert(internal.os_agent_month_spend(c3)=1.00,'month spend: chat, reported calls, charged holds and the round in flight');
  -- Finish with no text of its own after model steps: the last round is charged too.
  result:=pg_temp.ar_finish(re,'completed','done','');
  select * into t from public.os_review_turns where id=re;
  perform pg_temp.ar_assert((select cost_usd from public.os_agent_runs where id=re)=0.05
    and (select count(*) filter (where estimated) from public.os_agent_run_usage where run_id=re)=2
    and t.reply like 'The model gave no summary of its own; the receipt below is what the run did.%','finish charges the last unreported round');
  -- Nothing left this month: a start is refused before any instruction is posted.
  perform pg_temp.ar_rejected(format('select pg_temp.ar_start(%L,%L,%L,%L,%L,%L,1)',rz,c3,e,'Nothing left this month.','reply','company'),
    'P0001','agent_run_budget','a start the month cannot cover is refused');
end; $$;
reset role;
update public.os_companies set monthly_chat_usd=5 where id='f81961af-922d-4d05-a001-000000000003';
set local role service_role;
do $$
declare c3 constant uuid:='f81961af-922d-4d05-a001-000000000003';
  e constant uuid:='f81961af-922d-4d05-a002-000000000005'; f constant uuid:='f81961af-922d-4d05-a002-000000000006';
  rz constant uuid:='f81961af-922d-4d05-a004-000000000009'; rl constant uuid:='f81961af-922d-4d05-a004-00000000000a';
  result jsonb; t public.os_review_turns; old_lease uuid; n integer;
begin
  n:=(select count(*) from public.os_review_turns where company_id=c3);
  perform pg_temp.ar_rejected(format('select pg_temp.ar_start(%L,%L,%L,%L,%L,%L,1,%s)',rz,c3,e,'Nothing left today.','reply','platform',public.os_spent_today(null)+0.05),
    'P0001','agent_run_budget','a start today''s cap cannot cover is refused');
  perform pg_temp.ar_assert((select count(*) from public.os_review_turns where company_id=c3)=n,'a refused start posts no instruction');
  result:=pg_temp.ar_start(rz,c3,e,'Prepare follow-ups up to today''s cap.','reply','platform',1.00,public.os_spent_today(null)+0.40);
  perform pg_temp.ar_assert(result#>>'{run,ceiling_usd}'='0.4000','the ceiling is clamped to what today still has');
  result:=pg_temp.ar_round(rz,0.50);
  perform pg_temp.ar_assert(result->>'go'='false' and result->>'stop'='budget','a projection above the run''s own ceiling is its own limit');
  result:=pg_temp.ar_finish(rz,'completed','budget','');
  select * into t from public.os_review_turns where id=rz;
  perform pg_temp.ar_assert(t.reply like 'The run stopped before its first model step.%' and t.reply not like '%The model gave no summary%'
    and t.reply like '%stopped: its next step could have passed this run''s spending limit.%','a run stopped before any model step is not said to be silent');
  -- Giving a lease up: only the live lease; the run then reads as stalled and continues on a new lease.
  perform pg_temp.ar_start(rl,c3,f,'Prepare a note for the release case.','note','local',1.00);
  old_lease:=(select lease_id from public.os_agent_runs where id=rl);
  result:=public.os_agent_run_release(rl,c3,f,gen_random_uuid());
  perform pg_temp.ar_assert(result->>'released'='false' and (select lease_until>clock_timestamp() from public.os_agent_runs where id=rl),'another lease cannot give this one up');
  result:=public.os_agent_run_release(rl,c3,f,old_lease);
  perform pg_temp.ar_assert(result->>'released'='true' and (select lease_id=old_lease and lease_until<=clock_timestamp() and status='running' from public.os_agent_runs where id=rl),
    'the lease holder gives its lease up and the run reads as stalled at once');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_round(%L,0,100,%L)',rl,old_lease),'P0001','agent_run_fenced','a given-up lease is fenced');
  perform pg_temp.ar_assert(public.os_agent_run_release(rl,c3,f,old_lease)->>'released'='false','giving a lease up twice changes nothing');
  perform pg_temp.ar_rejected(format('select public.os_agent_run_release(%L,%L,%L,%L)',rl,c3,e,old_lease),'42501','agent run unavailable','another member cannot give the lease up');
  result:=pg_temp.ar_resume(rl,'continue');
  perform pg_temp.ar_assert(result->>'lease' is not null and (result->>'lease')::uuid<>old_lease,'continue after a given-up lease issues a new one');
  perform public.os_agent_run_cancel(rl,c3,f);
end; $$;
reset role;

-- (17, review) Money in the right place. A start must afford its first rounds at its own price,
-- not just ten cents; a run on a company's own key never spends the platform's day; and a
-- round's money stays in the day and month it was reserved in, however late its ledger row is
-- written, so a call in flight across midnight or a month end never lands past a cap that
-- another run was checked against.
insert into auth.users(id,email) values
 ('f81961af-922d-4d05-a002-000000000007','runs-ownkey-owner@example.invalid'),
 ('f81961af-922d-4d05-a002-000000000008','runs-platform-owner@example.invalid'),
 ('f81961af-922d-4d05-a002-000000000009','runs-platform-member@example.invalid');
insert into public.os_companies(id,name,monthly_chat_usd) values
 ('f81961af-922d-4d05-a001-000000000004','Fictional own-key company',0.60),
 ('f81961af-922d-4d05-a001-000000000005','Fictional platform company',5);
insert into public.os_company_members(company_id,user_id,role) values
 ('f81961af-922d-4d05-a001-000000000004','f81961af-922d-4d05-a002-000000000007','owner'),
 ('f81961af-922d-4d05-a001-000000000005','f81961af-922d-4d05-a002-000000000008','owner'),
 ('f81961af-922d-4d05-a001-000000000005','f81961af-922d-4d05-a002-000000000009','member');
set local role service_role;
do $$
declare c4 constant uuid:='f81961af-922d-4d05-a001-000000000004'; c5 constant uuid:='f81961af-922d-4d05-a001-000000000005';
  g constant uuid:='f81961af-922d-4d05-a002-000000000007'; h constant uuid:='f81961af-922d-4d05-a002-000000000008';
  k constant uuid:='f81961af-922d-4d05-a002-000000000009';
  r4 constant uuid:='f81961af-922d-4d05-a004-00000000000b'; rl2 constant uuid:='f81961af-922d-4d05-a004-00000000000d';
  rs constant uuid:='f81961af-922d-4d05-a004-00000000000e'; rt constant uuid:='f81961af-922d-4d05-a004-00000000000f';
  result jsonb; n integer; m integer;
begin
  -- A dear model on the company's own key: three of its first rounds would be held at 0.6678; the month leaves 0.60.
  n:=(select count(*) from public.os_review_turns where company_id=c4);
  m:=(select count(*) from public.os_messages om join public.os_threads th on th.id=om.thread_id where th.company_id=c4);
  perform pg_temp.ar_rejected(format('select pg_temp.ar_start(%L,%L,%L,%L,%L,%L,1,100,0.6678)',r4,c4,g,'Prepare follow-ups on a dear model.','reply','company'),
    'P0001','agent_run_budget','a ceiling below what the first rounds would be held at is refused, though above ten cents');
  perform pg_temp.ar_assert((select count(*) from public.os_review_turns where company_id=c4)=n
    and (select count(*) from public.os_messages om join public.os_threads th on th.id=om.thread_id where th.company_id=c4)=m
    and not exists(select 1 from public.os_agent_runs where id=r4),'a start its first rounds cannot afford posts no instruction and leaves no run');
  perform pg_temp.ar_rejected(format('select pg_temp.ar_start(%L,%L,%L,%L,%L,%L,1,100,-0.01)',r4,c4,g,'Prepare follow-ups.','reply','company'),
    'P0001','agent_run_request','a negative start minimum is refused');
  result:=pg_temp.ar_start(r4,c4,g,'Prepare follow-ups on a dear model.','reply','company',1.00,100,0.60);
  perform pg_temp.ar_assert(result->>'created'='true' and result#>>'{run,ceiling_usd}'='0.6000','a ceiling that covers the first rounds begins');
  -- An unpriced local run costs nothing, so no minimum applies to it.
  result:=pg_temp.ar_start(rl2,c5,k,'Prepare a local note.','note','local',1.00,100,9);
  perform pg_temp.ar_assert(result->>'created'='true' and result#>>'{run,ceiling_usd}'='0.0000','a local start is unaffected by the start minimum');
  perform public.os_agent_run_cancel(rl2,c5,k);
  perform pg_temp.ar_start(rs,c5,h,'Prepare follow-ups late in the day.','reply','platform',1.00);
  perform pg_temp.ar_start(rt,c5,k,'Prepare follow-ups after midnight.','reply','platform',1.00);
end; $$;
reset role;
-- r4's round one was reserved a minute before this month began and its call is still out;
-- rs's round one a minute before today (UTC) began. (Sequenced, as the guard requires.)
insert into public.os_agent_run_rounds(run_id,round,company_id,hold_usd,reserved_at) values
 ('f81961af-922d-4d05-a004-00000000000b',1,'f81961af-922d-4d05-a001-000000000004',0.20,date_trunc('month',now())-interval '1 minute'),
 ('f81961af-922d-4d05-a004-00000000000e',1,'f81961af-922d-4d05-a001-000000000005',0.20,date_trunc('day',now(),'UTC')-interval '1 minute');
update public.os_agent_runs set rounds=1,seq=seq+1 where id in ('f81961af-922d-4d05-a004-00000000000b','f81961af-922d-4d05-a004-00000000000e');
set local role service_role;
do $$
declare c4 constant uuid:='f81961af-922d-4d05-a001-000000000004'; c5 constant uuid:='f81961af-922d-4d05-a001-000000000005';
  g constant uuid:='f81961af-922d-4d05-a002-000000000007'; h constant uuid:='f81961af-922d-4d05-a002-000000000008';
  k constant uuid:='f81961af-922d-4d05-a002-000000000009';
  r4 constant uuid:='f81961af-922d-4d05-a004-00000000000b'; rs constant uuid:='f81961af-922d-4d05-a004-00000000000e';
  rt constant uuid:='f81961af-922d-4d05-a004-00000000000f';
  result jsonb; platform_day numeric; base numeric;
begin
  -- A call in flight across the month end reports a minute into the new month: it counts where it was reserved.
  perform pg_temp.ar_assert(internal.os_agent_month_spend(c4)=0 and public.os_spent_today(c4)=0,'a round reserved last month is neither this month''s nor today''s');
  result:=public.os_agent_run_usage(r4,1,1000,100,0.15);
  perform pg_temp.ar_assert(result->>'recorded'='true' and internal.os_agent_month_spend(c4)=0 and public.os_spent_today(c4)=0
    and (select cost_usd from public.os_agent_runs where id=r4)=0.15,'a late report counts in the month and day its round was reserved, not the ones it arrived in');
  -- Own-key spend is the company's day, never the platform's: in flight, and once ledgered.
  platform_day:=public.os_spent_today(null);
  result:=pg_temp.ar_round(r4,0.05,0.10);
  perform pg_temp.ar_assert(result->>'go'='true' and public.os_spent_today(c4)=0.05 and public.os_spent_today(null)=platform_day,
    'an own-key round in flight counts in the company''s day and leaves the platform''s day unchanged');
  perform public.os_agent_run_usage(r4,2,1000,100,0.04);
  perform pg_temp.ar_assert(public.os_spent_today(c4)=0.04 and internal.os_agent_month_spend(c4)=0.04 and public.os_spent_today(null)=platform_day,
    'own-key spend leaves os_spent_today(null) unchanged');
  perform public.os_agent_run_cancel(r4,c4,g);

  -- rs's call has been out since 23:59 yesterday. After midnight rt checks today's platform day
  -- against a cap only 0.25 above what today holds: rs's 0.20 is yesterday's, so rt's 0.10 fits.
  base:=public.os_spent_today(null);
  result:=pg_temp.ar_round(rt,0.10,base+0.25);
  perform pg_temp.ar_assert(result->>'go'='true' and public.os_spent_today(null)=base+0.10,
    'platform spend counts: a platform-key round in flight is in the platform''s day at its hold');
  -- rs is stopped: its hold is charged now, and stays in yesterday, the day whose checks counted it.
  perform public.os_agent_run_cancel(rs,c5,h);
  perform pg_temp.ar_assert((select estimated and cost_usd=0.20 from public.os_agent_run_usage where run_id=rs and round=1)
    and (select cost_usd from public.os_agent_runs where id=rs)=0.20,'the hold in flight across midnight is charged when its run is stopped');
  perform pg_temp.ar_assert(public.os_spent_today(null)=base+0.10 and public.os_spent_today(null)<=base+0.25,
    'a hold reserved before midnight and settled after it never lands past the cap today''s rounds were checked against');
  perform public.os_agent_run_usage(rt,1,1000,100,0.08);
  perform pg_temp.ar_assert(public.os_spent_today(null)=base+0.08 and public.os_spent_today(c5)=0.08,
    'platform spend counts on the platform''s day at what the call cost');
  perform public.os_agent_run_cancel(rt,c5,k);
end; $$;
reset role;

-- (13) The guard, even for the table owner.
select pg_temp.ar_rejected($q$update public.os_agent_runs set progress='[]'::jsonb,seq=seq+1 where id='f81961af-922d-4d05-a004-000000000003'$q$,
  '23514','agent run progress is append-only','progress cannot be rewritten');
select pg_temp.ar_rejected($q$update public.os_agent_runs set rounds=rounds-1,seq=seq+1 where id='f81961af-922d-4d05-a004-000000000003'$q$,
  '23514','an agent run keeps its identity, its plan and its counts','counts cannot decrease');
select pg_temp.ar_rejected($q$update public.os_agent_runs set rounds=rounds+1,seq=seq+2 where id='f81961af-922d-4d05-a004-000000000003'$q$,
  '23514','agent run updates are sequenced','seq cannot skip');
select pg_temp.ar_rejected($q$update public.os_agent_runs set ceiling_usd=5,seq=seq+1 where id='f81961af-922d-4d05-a004-000000000003'$q$,
  '23514','an agent run keeps its identity, its plan and its counts','the ceiling is fixed at start');
select pg_temp.ar_rejected($q$update public.os_agent_runs set plan='{"steps":["x"],"refs":[]}',seq=seq+1 where id='f81961af-922d-4d05-a004-000000000005'$q$,
  '23514','a finished agent run is frozen','a finished run is frozen');
select pg_temp.ar_rejected($q$update public.os_agent_runs set cost_usd=cost_usd-0.001 where id='f81961af-922d-4d05-a004-000000000003'$q$,
  '23514','agent run usage only grows','usage only grows');
select pg_temp.ar_rejected($q$update public.os_agent_run_usage set cost_usd=0 where run_id='f81961af-922d-4d05-a004-000000000003'$q$,
  '23514','the work record is append-only','the ledger is append-only');
select pg_temp.ar_rejected($q$delete from public.os_agent_run_reads where run_id='f81961af-922d-4d05-a004-000000000001'$q$,
  '23514','the work record is append-only','captures are append-only');
update public.os_agent_runs set plan='{"steps":["Owner plan"],"refs":[]}',seq=seq+1 where id='f81961af-922d-4d05-a004-000000000003';
select pg_temp.ar_rejected($q$update public.os_agent_runs set plan='{"steps":["Other plan"],"refs":[]}',seq=seq+1 where id='f81961af-922d-4d05-a004-000000000003'$q$,
  '23514','an agent run keeps its identity, its plan and its counts','a plan cannot be replaced');

-- (14) As signed-in members: public columns only, own company only, no writes, no RPCs.
set local request.jwt.claim.sub='f81961af-922d-4d05-a002-000000000002';
set local role authenticated;
select pg_temp.ar_assert((select count(*) from public.os_agent_runs where company_id='f81961af-922d-4d05-a001-000000000001')=4
  and (select count(*) from public.os_agent_runs where company_id='f81961af-922d-4d05-a001-000000000002')=0,'a member reads their company''s runs and nothing of another');
select pg_temp.ar_assert((select bool_and(jsonb_array_length(progress)>0) from public.os_agent_runs)
  and (select count(*) from public.os_agent_run_reads where run_id='f81961af-922d-4d05-a004-000000000001')=12
  and (select count(*) from public.os_agent_run_usage where run_id='f81961af-922d-4d05-a004-000000000001')=12,'members read progress, captures and the ledger');
select pg_temp.ar_rejected('select checkpoint from public.os_agent_runs','42501',null,'checkpoint is not readable signed in');
select pg_temp.ar_rejected('select lease_id from public.os_agent_runs','42501',null,'lease token is not readable signed in');
select pg_temp.ar_rejected('select * from public.os_agent_runs','42501',null,'no table-wide read');
select pg_temp.ar_rejected($q$insert into public.os_agent_runs(id,company_id,actor_id,payer,priced,model_label,ceiling_usd) values(gen_random_uuid(),'f81961af-922d-4d05-a001-000000000001','f81961af-922d-4d05-a002-000000000002','local',false,'x',0)$q$,'42501',null,'a member cannot insert a run');
select pg_temp.ar_rejected($q$update public.os_agent_runs set status='completed' where company_id='f81961af-922d-4d05-a001-000000000001'$q$,'42501',null,'a member cannot update a run');
select pg_temp.ar_rejected($q$insert into public.os_agent_run_reads(run_id,company_id,item_id,ref,title,lane,kind,status,waiting_days,item_updated_at,source_text) values('f81961af-922d-4d05-a004-000000000003','f81961af-922d-4d05-a001-000000000001',gen_random_uuid(),'w1','t','sales','reply','review',0,now(),'t')$q$,'42501',null,'a member cannot write a capture');
select pg_temp.ar_rejected($q$insert into public.os_agent_run_usage(run_id,round,company_id,input_tokens,output_tokens,cost_usd) values('f81961af-922d-4d05-a004-000000000003',9,'f81961af-922d-4d05-a001-000000000001',0,0,0)$q$,'42501',null,'a member cannot write the ledger');
select pg_temp.ar_rejected($q$select public.os_agent_run_cancel('f81961af-922d-4d05-a004-000000000005','f81961af-922d-4d05-a001-000000000001','f81961af-922d-4d05-a002-000000000002')$q$,'42501',null,'a member cannot call a run RPC');
select pg_temp.ar_rejected($q$select public.os_agent_run_start(gen_random_uuid(),'f81961af-922d-4d05-a001-000000000001','f81961af-922d-4d05-a002-000000000002','x','reply','local','x',1,100,0,600)$q$,'42501',null,'a member cannot start a run directly');
select pg_temp.ar_assert(public.os_chat_spent_this_month('f81961af-922d-4d05-a001-000000000001')=0.65,'chat spend as a member is messages plus ledger, a stopped round at its hold');
select pg_temp.ar_assert(public.os_chat_spent_this_month('f81961af-922d-4d05-a001-000000000002')=0,'chat spend of another company reads zero');
reset role;
set local request.jwt.claim.sub='f81961af-922d-4d05-a002-000000000003';
set local role authenticated;
select pg_temp.ar_assert((select count(*) from public.os_agent_runs)=1 and (select count(*) from public.os_agent_run_reads)=0
  and (select count(*) from public.os_agent_run_usage)=1 and (select count(*) from public.os_agent_run_rounds)=2,
  'the other company sees only its own run, captures, holds and ledger');
reset role;
set local request.jwt.claim.sub='';
set local role anon;
select pg_temp.ar_rejected('select id from public.os_agent_runs','42501',null,'anon reads nothing');
reset role;

-- (15) The chat path is unchanged: one founder source; a proposal staged before the migration still saves.
set local role service_role;
do $$
declare c1 constant uuid:='f81961af-922d-4d05-a001-000000000001'; a constant uuid:='f81961af-922d-4d05-a002-000000000001';
  legacy jsonb:=pg_temp.ar_get('legacy_proposal'); t jsonb; p jsonb; saved jsonb;
begin
  saved:=pg_temp.ar_decide(legacy,'save_to_work');
  perform pg_temp.ar_assert(saved->>'status'='saved' and saved->>'fingerprint'=legacy->>'fingerprint','a pre-migration chat proposal saves with its fingerprint unchanged');
  t:=public.os_review_begin(gen_random_uuid(),c1,a,'Draft a note about the crates.','draft',jsonb_build_object('draftFormat','note','knowledgeAssertion',null))->'turn';
  p:=public.os_review_propose(gen_random_uuid(),(t->>'id')::uuid,c1,a,jsonb_build_object('type','work','title','Crates note','body','A note about crates.',
    'lane','ops','kind','note','outwardAction',null,'citations',jsonb_build_array(jsonb_build_object('sourceId',t->>'person_message_id','quote','about the crates'))));
  perform pg_temp.ar_assert(jsonb_array_length(p->'sources')=1 and p#>>'{sources,0,origin}'='founder' and p#>>'{sources,0,id}'=t->>'person_message_id','a chat proposal keeps exactly one founder source');
  -- A fresh chat turn is still protected by the three-minute rule, exactly as before.
  perform pg_temp.ar_rejected(format('select public.os_review_interrupt(%L,%L,%L)',t->>'id',c1,a),
    '23514','review turn may still be running; check again later','chat interrupt keeps its three-minute rule');
end; $$;
reset role;

-- ACL: service-role RPCs only, invoker functions with an empty search_path, no table-wide grants.
select pg_temp.ar_assert(bool_and(not has_function_privilege('authenticated',f,'execute') and not has_function_privilege('anon',f,'execute')
  and has_function_privilege('service_role',f,'execute')),'run RPCs are service-role only')
from unnest(array['public.os_agent_run_start(uuid,uuid,uuid,text,text,text,text,numeric,numeric,numeric,integer)','public.os_agent_run_round(uuid,uuid,uuid,uuid,integer,numeric,numeric)',
  'public.os_agent_run_usage(uuid,integer,integer,integer,numeric)','public.os_agent_run_step(uuid,uuid,uuid,uuid,integer,jsonb)',
  'public.os_agent_run_read(uuid,uuid,uuid,uuid,uuid,text)','public.os_agent_run_propose(uuid,uuid,uuid,uuid,uuid,uuid,jsonb)',
  'public.os_agent_run_finish(uuid,uuid,uuid,uuid,integer,text,text,text,integer,integer)','public.os_agent_run_cancel(uuid,uuid,uuid)',
  'public.os_agent_run_release(uuid,uuid,uuid,uuid)','public.os_agent_run_resume(uuid,uuid,uuid,integer,text,text,integer)',
  'public.os_spent_today(uuid)']) f;
select pg_temp.ar_assert(bool_and(not prosecdef and proconfig=array['search_path=""']),'new functions are security invoker with an empty search_path')
from pg_proc where (proname like 'os_agent_%' or proname='os_spent_today') and pronamespace in ('public'::regnamespace,'internal'::regnamespace);
select pg_temp.ar_assert(prosecdef and proconfig=array['search_path=""'],'chat spend stays definer, search_path tightened')
from pg_proc where oid='public.os_chat_spent_this_month(uuid)'::regprocedure;
select pg_temp.ar_assert(has_function_privilege('authenticated','public.os_chat_spent_this_month(uuid)','execute')
  and not has_function_privilege('anon','public.os_chat_spent_this_month(uuid)','execute'),'chat spend keeps its grants');
select pg_temp.ar_assert(not has_function_privilege('authenticated','public.os_review_interrupt(uuid,uuid,uuid)','execute')
  and has_function_privilege('service_role','internal.os_review_validate(jsonb,public.os_review_turns)','execute'),'replaced review functions keep their grants');
select pg_temp.ar_assert(not has_table_privilege(r,t,p),'no table-wide grant: '||r||' '||p||' '||t)
from unnest(array['authenticated','service_role']) r, unnest(array['public.os_agent_runs','public.os_agent_run_reads','public.os_agent_run_rounds','public.os_agent_run_usage']) t,
  unnest(array['select','insert','update','delete']) p;
select pg_temp.ar_assert(not has_column_privilege('authenticated','public.os_agent_runs',col,'select'),'authenticated never reads '||col)
from unnest(array['checkpoint','lease_id']) col;
select pg_temp.ar_assert(relrowsecurity,'RLS on '||relname) from pg_class where oid in
  ('public.os_agent_runs'::regclass,'public.os_agent_run_reads'::regclass,'public.os_agent_run_rounds'::regclass,'public.os_agent_run_usage'::regclass);
select pg_temp.ar_assert((select count(*) from public.os_work_items where company_id='f81961af-922d-4d05-a001-000000000001'
  and metadata->>'by'='cofounder')=3,'only the person''s three saves created Work');
select pg_temp.ar_assert((select count(*) from public.os_company_memory where company_id in ('f81961af-922d-4d05-a001-000000000001','f81961af-922d-4d05-a001-000000000002'))=0,'no company knowledge was written');
select count(*) as agent_runs_assertions_passed from ar_assertions;
rollback;
