-- S1i local preparation: bind each new turn to the person's selected artifact
-- format and separately entered company assertion. Historic intent stays NULL;
-- do not invent selections for older conversations. Owner applies production SQL.

create function internal.os_review_intent_valid(p_mode text,p_intent jsonb)
returns boolean language plpgsql immutable security invoker set search_path='' as $$
declare format text; assertion text; assertion_units integer;
begin
  if internal.os_review_keys(p_intent,array['draftFormat','knowledgeAssertion']) is not true then return false; end if;
  if p_intent->'draftFormat' <> 'null'::jsonb and
      (jsonb_typeof(p_intent->'draftFormat') <> 'string' or
       p_intent->>'draftFormat' not in ('email','reply','post','note','research','decision')) then return false; end if;
  if p_intent->'knowledgeAssertion' <> 'null'::jsonb then
    if jsonb_typeof(p_intent->'knowledgeAssertion') <> 'string' then return false; end if;
    assertion:=p_intent->>'knowledgeAssertion';
    -- Keep the historic memory minimum of three Unicode code points and the
    -- existing browser/DTO maximum of 2000 UTF-16 units. Reject oversized text
    -- before splitting; do not weaken the memory table's existing CHECK.
    if length(assertion) not between 3 and 2000 then return false; end if;
    select length(assertion)+count(*) filter(where ascii(character)>65535)
      into assertion_units from regexp_split_to_table(assertion,'') as chars(character);
    -- The same whitespace set as ECMAScript trim; no silent normalization.
    if assertion_units>2000 or assertion <> btrim(assertion,
      E' \t\n\r\f' || chr(11) || U&'\00a0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200a\2028\2029\202f\205f\3000\feff') then return false; end if;
  end if;
  format:=p_intent->>'draftFormat';
  return case p_mode
    when 'ask' then format is null and assertion is null
    when 'draft' then format is not null and assertion is null
    when 'knowledge' then format is null
    when 'both' then format is not null
    else false end;
end; $$;

alter table public.os_review_turns add column request_intent jsonb;
alter table public.os_review_turns add constraint os_review_turns_request_intent_check
  check(request_intent is null or internal.os_review_intent_valid(request_mode,request_intent));
grant insert(request_intent) on public.os_review_turns to service_role;

create function internal.os_review_intent_immutable()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if tg_op='INSERT' then
    if internal.os_review_intent_valid(new.request_mode,new.request_intent) is not true then
      raise exception 'review_intent_required' using errcode='P0001';
    end if;
  elsif new.request_intent is distinct from old.request_intent then
    raise exception 'review_intent_required' using errcode='P0001';
  end if;
  return new;
end; $$;
create trigger os_review_turns_intent_immutable
before insert or update of request_intent on public.os_review_turns
for each row execute function internal.os_review_intent_immutable();

create function public.os_review_begin(p_id uuid,p_company uuid,p_actor uuid,p_question text,p_mode text,p_intent jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare t public.os_review_turns; thread uuid; message uuid; captured_history jsonb;
begin
  perform internal.os_review_access(p_company,p_actor);
  if p_id is null or p_question is null or length(btrim(p_question)) not between 1 and 40000
     or p_mode is null or p_mode not in ('ask','draft','knowledge','both') then
    raise exception 'invalid review question or mode' using errcode='check_violation';
  end if;
  select * into t from public.os_review_turns where id=p_id for update;
  if found then
    if t.company_id<>p_company or t.actor_id<>p_actor or t.question<>p_question or t.request_mode<>p_mode
       or t.request_intent is distinct from p_intent then
      raise exception 'review request collision' using errcode='check_violation';
    end if;
    return jsonb_build_object('created',false,'turn',to_jsonb(t));
  end if;
  if internal.os_review_intent_valid(p_mode,p_intent) is not true then
    raise exception 'review_intent_required' using errcode='P0001';
  end if;
  select id into thread from public.os_threads where company_id=p_company order by updated_at desc,id limit 1;
  if thread is null then insert into public.os_threads(company_id) values(p_company) returning id into thread; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'role',m.role,'body',m.body) order by m.created_at,m.id),'[]'::jsonb)
    into captured_history from (
      select id,role,body,created_at from public.os_messages where thread_id=thread order by created_at desc,id desc limit 40
    ) m;
  insert into public.os_messages(thread_id,role,body,actor) values(thread,'person',p_question,p_actor) returning id into message;
  insert into public.os_review_turns(id,company_id,actor_id,thread_id,person_message_id,question,history,request_mode,request_intent)
    values(p_id,p_company,p_actor,thread,message,p_question,captured_history,p_mode,p_intent) returning * into t;
  return jsonb_build_object('created',true,'turn',to_jsonb(t));
end; $$;
drop function public.os_review_begin(uuid,uuid,uuid,text,text);

create or replace function internal.os_review_validate(p_payload jsonb,p_turn public.os_review_turns)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare m public.os_messages; citation jsonb; duration jsonb; valid_date date; source_id text; source_text text;
begin
  if internal.os_review_intent_valid(p_turn.request_mode,p_turn.request_intent) is not true then
    raise exception 'review_intent_required' using errcode='P0001';
  end if;
  select * into m from public.os_messages where id=p_turn.person_message_id;
  if not found or m.thread_id<>p_turn.thread_id or m.role<>'person' or m.actor is distinct from p_turn.actor_id
     or m.body<>p_turn.question or not exists(select 1 from public.os_threads where id=m.thread_id and company_id=p_turn.company_id) then
    raise exception 'review source unavailable' using errcode='check_violation';
  end if;
  if jsonb_typeof(p_payload) is distinct from 'object' or jsonb_typeof(p_payload->'citations') is distinct from 'array' then
    raise exception 'invalid review payload' using errcode='check_violation';
  end if;
  if p_payload->>'type'='knowledge' then
    source_id:=m.id::text||':assertion';
    source_text:=p_turn.request_intent->>'knowledgeAssertion';
    if p_turn.request_mode not in ('knowledge','both') or source_text is null
       or p_payload->>'statement' is distinct from source_text then
      raise exception 'review_knowledge_assertion' using errcode='P0001';
    end if;
  else
    source_id:=m.id::text;
    source_text:=m.body;
    if p_payload->>'type'='work' and (p_turn.request_mode not in ('draft','both')
        or p_payload->>'kind' is distinct from p_turn.request_intent->>'draftFormat') then
      raise exception 'review_draft_format' using errcode='P0001';
    end if;
  end if;
  if jsonb_array_length(p_payload->'citations') not between 1 and 8
     or (select count(*)<>count(distinct value) from jsonb_array_elements(p_payload->'citations')) then
    raise exception 'invalid review citations' using errcode='check_violation';
  end if;
  for citation in select value from jsonb_array_elements(p_payload->'citations') loop
    if internal.os_review_keys(citation,array['sourceId','quote']) is not true
       or internal.os_review_text(citation->'sourceId',200) is not true
       or internal.os_review_text(citation->'quote',8000) is not true
       or citation->>'sourceId'<>source_id or strpos(source_text,citation->>'quote')=0 then
      raise exception 'review citation does not match founder source' using errcode='check_violation';
    end if;
  end loop;
  if p_payload->>'type'='work' then
    if internal.os_review_keys(p_payload,array['type','title','body','lane','kind','outwardAction','citations']) is not true
       or internal.os_review_text(p_payload->'title',200) is not true or internal.os_review_text(p_payload->'body',8000) is not true
       or internal.os_review_text(p_payload->'lane',40) is not true or internal.os_review_text(p_payload->'kind',40) is not true
       or (p_payload->'outwardAction'<>'null'::jsonb and internal.os_review_text(p_payload->'outwardAction',60) is not true) then
      raise exception 'invalid work proposal' using errcode='check_violation';
    end if;
  elsif p_payload->>'type'='knowledge' then
    if internal.os_review_keys(p_payload,array['type','statement','kind','scope','duration','citations']) is not true
       or internal.os_review_text(p_payload->'statement',2000) is not true
       or coalesce(p_payload->>'kind','') not in ('fact','preference','constraint','person','decision')
       or internal.os_review_keys(p_payload->'scope',array['type','label']) is not true
       or coalesce(p_payload#>>'{scope,type}','') not in ('company','project','customer')
       or internal.os_review_text(p_payload#>'{scope,label}',200) is not true then
      raise exception 'invalid knowledge proposal' using errcode='check_violation';
    end if;
    duration:=p_payload->'duration';
    if duration->>'type'='until_changed' then
      if internal.os_review_keys(duration,array['type']) is not true then raise exception 'invalid knowledge duration' using errcode='check_violation'; end if;
    elsif duration->>'type'='until_date' then
      if internal.os_review_keys(duration,array['type','date']) is not true or jsonb_typeof(duration->'date')<>'string'
         or coalesce(duration->>'date','') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'invalid knowledge date' using errcode='check_violation'; end if;
      begin valid_date:=(duration->>'date')::date;
      exception when others then raise exception 'invalid knowledge date' using errcode='check_violation'; end;
      if to_char(valid_date,'YYYY-MM-DD')<>duration->>'date' or valid_date<(now() at time zone 'UTC')::date then
        raise exception 'expired or invalid knowledge date' using errcode='check_violation';
      end if;
    else raise exception 'invalid knowledge duration' using errcode='check_violation'; end if;
  else raise exception 'invalid review proposal type' using errcode='check_violation'; end if;
  return jsonb_build_array(jsonb_build_object('id',source_id,'companyId',p_turn.company_id,
    'revision',encode(sha256(convert_to(source_text,'UTF8')),'hex'),'text',source_text,'origin','founder'));
end; $$;

create or replace function internal.os_review_fingerprint(p_id uuid,p_turn public.os_review_turns,p_revision integer,p_payload jsonb,p_sources jsonb)
returns text language sql immutable security invoker set search_path='' as $$
  select encode(sha256(convert_to(
    (jsonb_build_object('contract',case when p_turn.request_intent is null then '2026-09-22.durable.1' else '2026-09-27.intent.1' end,'id',p_id,
      'turnId',p_turn.id,'companyId',p_turn.company_id,'actorId',p_turn.actor_id,'threadId',p_turn.thread_id,
      'revision',p_revision,'payload',p_payload,'sources',p_sources)
     ||case when p_turn.request_intent is null then '{}'::jsonb else jsonb_build_object('requestIntent',p_turn.request_intent) end)::text,'UTF8')),'hex');
$$;

create or replace function public.os_review_propose(p_id uuid,p_turn uuid,p_company uuid,p_actor uuid,p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare t public.os_review_turns; p public.os_review_proposals; src jsonb; fingerprint text;
begin
  perform internal.os_review_access(p_company,p_actor);
  select * into t from public.os_review_turns where id=p_turn and company_id=p_company and actor_id=p_actor for update;
  if not found then raise exception 'review turn unavailable' using errcode='insufficient_privilege'; end if;
  -- Returning an already stored exact receipt is not new staging. This keeps
  -- historical retries readable without fabricating a missing intent.
  select * into p from public.os_review_proposals where id=p_id;
  if found then
    if p.turn_id<>p_turn or p.company_id<>p_company or p.actor_id<>p_actor or p.payload is distinct from p_payload then
      raise exception 'review proposal collision' using errcode='check_violation';
    end if;
    return to_jsonb(p);
  end if;
  select * into p from public.os_review_proposals where turn_id=p_turn and payload=p_payload order by created_at,id limit 1;
  if found then return to_jsonb(p); end if;
  src:=internal.os_review_validate(p_payload,t);
  if not(t.request_mode='both' or (t.request_mode='draft' and p_payload->>'type'='work')
      or (t.request_mode='knowledge' and p_payload->>'type'='knowledge')) then
    raise exception 'review proposal not permitted by selected mode' using errcode='check_violation';
  end if;
  if t.status<>'running' then raise exception 'review turn is closed' using errcode='check_violation'; end if;
  if(select count(*) from public.os_review_proposals where turn_id=p_turn)>=32 then
    raise exception 'review proposal limit reached' using errcode='check_violation';
  end if;
  fingerprint:=internal.os_review_fingerprint(p_id,t,1,p_payload,src);
  insert into public.os_review_proposals(id,company_id,actor_id,turn_id,fingerprint,payload,sources)
    values(p_id,p_company,p_actor,p_turn,fingerprint,p_payload,src) returning * into p;
  insert into public.os_review_proposal_revisions(proposal_id,revision,payload,sources,fingerprint)
    values(p.id,p.revision,p.payload,p.sources,p.fingerprint);
  return to_jsonb(p);
end; $$;

create function public.os_review_decide(p_id uuid,p_company uuid,p_actor uuid,p_revision integer,p_fingerprint text,p_action text,p_payload jsonb,p_knowledge_approved boolean)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare p public.os_review_proposals; t public.os_review_turns; src jsonb; target uuid; provenance jsonb;
begin
  perform internal.os_review_access(p_company,p_actor);
  select * into p from public.os_review_proposals where id=p_id and company_id=p_company and actor_id=p_actor;
  if not found then raise exception 'review proposal unavailable' using errcode='insufficient_privilege'; end if;
  select * into t from public.os_review_turns where id=p.turn_id and company_id=p_company and actor_id=p_actor for update;
  if not found then raise exception 'review turn unavailable' using errcode='insufficient_privilege'; end if;
  select * into p from public.os_review_proposals where id=p_id for update;
  if p_revision is distinct from p.revision or p_fingerprint is distinct from p.fingerprint then
    raise exception 'stale review: read the current revision' using errcode='check_violation';
  end if;
  if p_action is null or p_action not in ('revise','dismiss','save_to_work','add_to_company_knowledge') then
    raise exception 'invalid review action' using errcode='check_violation';
  end if;
  if p_knowledge_approved is distinct from (p_action='add_to_company_knowledge') then
    raise exception 'review_knowledge_approval' using errcode='P0001';
  end if;
  if(p_action='save_to_work' and p.payload->>'type'<>'work') or(p_action='add_to_company_knowledge' and p.payload->>'type'<>'knowledge')
     or(p_action<>'revise' and p_payload is not null) then
    raise exception 'review action does not match content' using errcode='check_violation';
  end if;
  if p.status='saved' and p_action in ('save_to_work','add_to_company_knowledge') then return to_jsonb(p); end if;
  if p.status='dismissed' and p_action='dismiss' then return to_jsonb(p); end if;
  if p.status<>'proposed' then raise exception 'review proposal is closed' using errcode='check_violation'; end if;
  if p_action='dismiss' then
    update public.os_review_proposals set status='dismissed',updated_at=now() where id=p_id returning * into p;
    return to_jsonb(p);
  end if;
  if p_action='revise' then
    src:=internal.os_review_validate(p_payload,t);
    if p_payload->>'type'<>p.payload->>'type' then raise exception 'review type cannot change' using errcode='check_violation'; end if;
    if exists(select 1 from public.os_review_proposals where turn_id=t.id and id<>p.id and payload=p_payload and sources=src) then
      raise exception 'duplicate review proposal' using errcode='check_violation';
    end if;
    if p_payload=p.payload and src=p.sources then return to_jsonb(p); end if;
    update public.os_review_proposals set revision=revision+1,payload=p_payload,sources=src,
      fingerprint=internal.os_review_fingerprint(p_id,t,p.revision+1,p_payload,src),last_edited_by=p_actor,updated_at=now()
      where id=p_id returning * into p;
    insert into public.os_review_proposal_revisions(proposal_id,revision,payload,sources,fingerprint,editor)
      values(p.id,p.revision,p.payload,p.sources,p.fingerprint,p_actor);
    return to_jsonb(p);
  end if;
  src:=internal.os_review_validate(p.payload,t);
  if src<>p.sources or p.fingerprint<>internal.os_review_fingerprint(p.id,t,p.revision,p.payload,src) then
    raise exception 'review source changed' using errcode='check_violation';
  end if;
  provenance:=jsonb_build_object('proposalId',p.id,'revision',p.revision,'fingerprint',p.fingerprint,
    'turnId',t.id,'threadId',t.thread_id,'authorship','model','lastEditedBy',p.last_edited_by,
    'confirmedBy',p_actor,'externallyVerified',false,'sources',src,'citations',p.payload->'citations',
    'requestIntent',t.request_intent,'knowledgeApproved',p_knowledge_approved);
  if p_action='save_to_work' then
    insert into public.os_work_items(company_id,lane,kind,title,status,required_action,notes,sources,metadata)
      values(p_company,p.payload->>'lane',p.payload->>'kind',p.payload->>'title','drafted',p.payload->>'outwardAction',
        p.payload->>'body',src,jsonb_build_object('by','cofounder','review',provenance)) returning id into target;
    insert into public.os_work_item_events(item_id,actor,event,detail) values(target,p_actor,'saved_from_review',provenance);
    update public.os_review_proposals set status='saved',record_id=target,work_item_id=target,confirmed_by=p_actor,saved_at=now(),updated_at=now()
      where id=p_id returning * into p;
  else
    insert into public.os_company_memory(company_id,fact,kind,source,created_by,review_proposal_id,review_scope,review_duration,review_provenance,confirmed_by,confirmed_at)
      values(p_company,p.payload->>'statement',p.payload->>'kind','cofounder',null,p.id,p.payload->'scope',p.payload->'duration',provenance,p_actor,now()) returning id into target;
    update public.os_review_proposals set status='saved',record_id=target,memory_id=target,confirmed_by=p_actor,saved_at=now(),updated_at=now()
      where id=p_id returning * into p;
  end if;
  return to_jsonb(p);
end; $$;
drop function public.os_review_decide(uuid,uuid,uuid,integer,text,text,jsonb);

revoke all on function internal.os_review_intent_valid(text,jsonb),internal.os_review_intent_immutable(),
  public.os_review_begin(uuid,uuid,uuid,text,text,jsonb),public.os_review_decide(uuid,uuid,uuid,integer,text,text,jsonb,boolean)
  from public,anon,authenticated;
grant execute on function internal.os_review_intent_valid(text,jsonb),internal.os_review_intent_immutable(),
  public.os_review_begin(uuid,uuid,uuid,text,text,jsonb),public.os_review_decide(uuid,uuid,uuid,integer,text,text,jsonb,boolean)
  to service_role;
