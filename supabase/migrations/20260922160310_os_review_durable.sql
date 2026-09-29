-- Local S1d: durable, individually reviewed model suggestions. Prepared for
-- operator review; never apply remotely automatically. RPCs are service-only
-- SECURITY INVOKER: verified routes supply p_actor, never the model/browser.
-- Saving is not approving, completing, publishing or sending.

create table public.os_review_turns (
  id uuid primary key,
  company_id uuid not null references public.os_companies(id),
  actor_id uuid not null references auth.users(id),
  thread_id uuid not null references public.os_threads(id),
  person_message_id uuid not null unique references public.os_messages(id),
  reply_message_id uuid unique references public.os_messages(id),
  status text not null default 'running' check (status in ('running','completed','failed')),
  question text not null check (length(btrim(question)) between 1 and 40000),
  -- Immutable, bounded conversation prefix captured before the current source
  -- is inserted. Later parallel turns cannot enter this generation's history.
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array' and jsonb_array_length(history) <= 40),
  reply text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'running' and reply is null and reply_message_id is null)
      or (status <> 'running' and reply is not null and reply_message_id is not null))
);
create index os_review_turns_company_actor_idx on public.os_review_turns(company_id, actor_id, created_at desc);

create table public.os_review_proposals (
  id uuid primary key,
  company_id uuid not null references public.os_companies(id),
  actor_id uuid not null references auth.users(id),
  turn_id uuid not null references public.os_review_turns(id),
  revision integer not null default 1 check (revision > 0),
  fingerprint text not null check (fingerprint ~ '^[0-9a-f]{64}$'),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  sources jsonb not null check (jsonb_typeof(sources) = 'array'),
  status text not null default 'proposed' check (status in ('proposed','saved','dismissed')),
  record_id uuid,
  work_item_id uuid unique references public.os_work_items(id),
  memory_id uuid unique references public.os_company_memory(id),
  last_edited_by uuid references auth.users(id),
  confirmed_by uuid references auth.users(id),
  saved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status <> 'saved' and record_id is null and work_item_id is null and memory_id is null and confirmed_by is null and saved_at is null)
    or (status = 'saved' and record_id is not null and confirmed_by is not null and confirmed_by = actor_id and saved_at is not null and
      ((payload->>'type' = 'work' and work_item_id is not null and memory_id is null and record_id = work_item_id)
       or (payload->>'type' = 'knowledge' and memory_id is not null and work_item_id is null and record_id = memory_id))))
);
create index os_review_proposals_turn_idx on public.os_review_proposals(turn_id, created_at);
create index os_review_proposals_company_actor_idx on public.os_review_proposals(company_id, actor_id, created_at desc);

create table public.os_review_proposal_revisions (
  proposal_id uuid not null references public.os_review_proposals(id),
  revision integer not null check (revision > 0),
  payload jsonb not null,
  sources jsonb not null,
  fingerprint text not null,
  editor uuid references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (proposal_id, revision)
);
create trigger os_review_revisions_append_only before update or delete
  on public.os_review_proposal_revisions for each row execute function internal.os_event_append_only();

alter table public.os_company_memory
  add column review_proposal_id uuid unique references public.os_review_proposals(id),
  add column review_scope jsonb,
  add column review_duration jsonb,
  add column review_provenance jsonb,
  add column confirmed_by uuid references auth.users(id),
  add column confirmed_at timestamptz,
  add constraint os_memory_review_complete check (
    (review_proposal_id is null and review_scope is null and review_duration is null and review_provenance is null and confirmed_by is null and confirmed_at is null)
    or (review_proposal_id is not null and review_scope is not null and review_duration is not null and review_provenance is not null and confirmed_by is not null and confirmed_at is not null and source = 'cofounder' and created_by is null)
  );

-- A previous table INSERT grant would silently expose every new attribution
-- column. Direct human teaching retains only its existing input fields.
revoke insert on public.os_company_memory from authenticated;
grant insert (company_id, fact, kind) on public.os_company_memory to authenticated;

create or replace function internal.os_memory_guard()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare acting_user uuid := (select auth.uid());
begin
  if tg_op = 'INSERT' then
    new.retired_at := null; new.retired_by := null; new.retired_reason := null;
    if acting_user is not null then
      new.source := 'person'; new.created_by := acting_user;
    end if;
    return new;
  end if;
  if new.fact is distinct from old.fact or new.kind is distinct from old.kind
     or new.source is distinct from old.source or new.company_id is distinct from old.company_id
     or new.created_by is distinct from old.created_by or new.created_at is distinct from old.created_at
     or new.review_proposal_id is distinct from old.review_proposal_id
     or new.review_scope is distinct from old.review_scope or new.review_duration is distinct from old.review_duration
     or new.review_provenance is distinct from old.review_provenance
     or new.confirmed_by is distinct from old.confirmed_by or new.confirmed_at is distinct from old.confirmed_at
     or (old.retired_at is not null and new.retired_at is distinct from old.retired_at) then
    raise exception 'memory is corrected by retiring it, not by rewriting it' using errcode = 'check_violation';
  end if;
  return new;
end; $$;

alter table public.os_review_turns enable row level security;
alter table public.os_review_proposals enable row level security;
alter table public.os_review_proposal_revisions enable row level security;
revoke all on public.os_review_turns, public.os_review_proposals, public.os_review_proposal_revisions from public, anon, authenticated, service_role;
grant select on public.os_review_turns, public.os_review_proposals, public.os_review_proposal_revisions to authenticated, service_role;
grant insert (id, company_id, actor_id, thread_id, person_message_id, question, history) on public.os_review_turns to service_role;
grant update (reply_message_id, status, reply, updated_at) on public.os_review_turns to service_role;
grant insert (id, company_id, actor_id, turn_id, fingerprint, payload, sources) on public.os_review_proposals to service_role;
grant update (revision, fingerprint, payload, sources, status, record_id, work_item_id, memory_id, last_edited_by, confirmed_by, saved_at, updated_at) on public.os_review_proposals to service_role;
grant insert (proposal_id, revision, payload, sources, fingerprint, editor) on public.os_review_proposal_revisions to service_role;

create policy os_review_turns_read on public.os_review_turns for select to authenticated using (
  public.os_is_member(company_id) and exists(select 1 from public.os_beta_status)
);
create policy os_review_proposals_read on public.os_review_proposals for select to authenticated using (
  public.os_is_member(company_id) and exists(select 1 from public.os_beta_status)
);
create policy os_review_revisions_read on public.os_review_proposal_revisions for select to authenticated using (
  exists(select 1 from public.os_review_proposals p where p.id = proposal_id)
);

-- All mutating RPCs use the same lock order: company, current membership,
-- current beta/operator entitlement, turn, proposal. No model call is inside
-- these short transactions. Entitlement deletion cannot race a successful save.
create function internal.os_review_access(p_company uuid, p_actor uuid)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if p_company is null or p_actor is null then
    raise exception 'review access denied' using errcode = 'insufficient_privilege';
  end if;
  perform 1 from public.os_companies where id = p_company for update;
  if not found then raise exception 'review access denied' using errcode = 'insufficient_privilege'; end if;
  perform 1 from public.os_company_members where company_id = p_company and user_id = p_actor for share;
  if not found then raise exception 'review access denied' using errcode = 'insufficient_privilege'; end if;
  perform 1 from internal.os_beta_members where user_id = p_actor for share;
  if not found then
    perform 1 from internal.operators where user_id = p_actor for share;
    if not found then raise exception 'review access denied' using errcode = 'insufficient_privilege'; end if;
  end if;
end; $$;

create function internal.os_review_keys(p_value jsonb, p_keys text[])
returns boolean language sql immutable security invoker set search_path = '' as $$
  select case when jsonb_typeof(p_value) = 'object' then
    p_value ?& p_keys and (select count(*) from jsonb_object_keys(p_value)) = cardinality(p_keys)
    else false end;
$$;
create function internal.os_review_text(p_value jsonb, p_max integer)
returns boolean language sql immutable security invoker set search_path = '' as $$
  select coalesce(jsonb_typeof(p_value) = 'string' and length(btrim(p_value #>> '{}')) > 0 and length(p_value #>> '{}') <= p_max, false);
$$;

-- This validates shape and exact attribution, not truth or semantic entailment.
-- Source identity is obtained from the stored founder message, never the DTO.
create function internal.os_review_validate(p_payload jsonb, p_turn public.os_review_turns)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare m public.os_messages; citation jsonb; duration jsonb; valid_date date;
begin
  select * into m from public.os_messages where id = p_turn.person_message_id;
  if not found or m.thread_id <> p_turn.thread_id or m.role <> 'person' or m.actor is distinct from p_turn.actor_id
     or m.body <> p_turn.question or not exists(select 1 from public.os_threads where id = m.thread_id and company_id = p_turn.company_id) then
    raise exception 'review source unavailable' using errcode = 'check_violation';
  end if;
  if jsonb_typeof(p_payload) is distinct from 'object' or jsonb_typeof(p_payload->'citations') is distinct from 'array' then
    raise exception 'invalid review payload' using errcode = 'check_violation';
  end if;
  if jsonb_array_length(p_payload->'citations') not between 1 and 8
     or (select count(*) <> count(distinct value) from jsonb_array_elements(p_payload->'citations')) then
    raise exception 'invalid review citations' using errcode = 'check_violation';
  end if;
  for citation in select value from jsonb_array_elements(p_payload->'citations') loop
    if internal.os_review_keys(citation, array['sourceId','quote']) is not true
       or internal.os_review_text(citation->'sourceId',200) is not true
       or internal.os_review_text(citation->'quote',8000) is not true
       or citation->>'sourceId' <> m.id::text or strpos(m.body, citation->>'quote') = 0 then
      raise exception 'review citation does not match founder source' using errcode = 'check_violation';
    end if;
  end loop;
  if p_payload->>'type' = 'work' then
    if internal.os_review_keys(p_payload,array['type','title','body','lane','kind','outwardAction','citations']) is not true
       or internal.os_review_text(p_payload->'title',200) is not true or internal.os_review_text(p_payload->'body',8000) is not true
       or internal.os_review_text(p_payload->'lane',40) is not true or internal.os_review_text(p_payload->'kind',40) is not true
       or (p_payload->'outwardAction' <> 'null'::jsonb and internal.os_review_text(p_payload->'outwardAction',60) is not true) then
      raise exception 'invalid work proposal' using errcode = 'check_violation';
    end if;
  elsif p_payload->>'type' = 'knowledge' then
    if internal.os_review_keys(p_payload,array['type','statement','kind','scope','duration','citations']) is not true
       or internal.os_review_text(p_payload->'statement',2000) is not true or length(btrim(p_payload->>'statement')) < 3
       or coalesce(p_payload->>'kind','') not in ('fact','preference','constraint','person','decision')
       or internal.os_review_keys(p_payload->'scope',array['type','label']) is not true
       or coalesce(p_payload#>>'{scope,type}','') not in ('company','project','customer')
       or internal.os_review_text(p_payload#>'{scope,label}',200) is not true then
      raise exception 'invalid knowledge proposal' using errcode = 'check_violation';
    end if;
    duration := p_payload->'duration';
    if duration->>'type' = 'until_changed' then
      if internal.os_review_keys(duration,array['type']) is not true then raise exception 'invalid knowledge duration' using errcode='check_violation'; end if;
    elsif duration->>'type' = 'until_date' then
      if internal.os_review_keys(duration,array['type','date']) is not true or jsonb_typeof(duration->'date') <> 'string'
         or coalesce(duration->>'date','') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'invalid knowledge date' using errcode='check_violation'; end if;
      begin valid_date := (duration->>'date')::date;
      exception when others then raise exception 'invalid knowledge date' using errcode='check_violation'; end;
      if to_char(valid_date,'YYYY-MM-DD') <> duration->>'date' or valid_date < (now() at time zone 'UTC')::date then
        raise exception 'expired or invalid knowledge date' using errcode='check_violation';
      end if;
    else raise exception 'invalid knowledge duration' using errcode='check_violation'; end if;
  else raise exception 'invalid review proposal type' using errcode = 'check_violation'; end if;
  return jsonb_build_array(jsonb_build_object('id',m.id,'companyId',p_turn.company_id,
    'revision',encode(sha256(convert_to(m.body,'UTF8')),'hex'),'text',m.body,'origin','founder'));
end; $$;

create function internal.os_review_fingerprint(p_id uuid, p_turn public.os_review_turns, p_revision integer, p_payload jsonb, p_sources jsonb)
returns text language sql immutable security invoker set search_path = '' as $$
  select encode(sha256(convert_to(jsonb_build_object('contract','2026-09-22.durable.1','id',p_id,
    'turnId',p_turn.id,'companyId',p_turn.company_id,'actorId',p_turn.actor_id,'threadId',p_turn.thread_id,
    'revision',p_revision,'payload',p_payload,'sources',p_sources)::text,'UTF8')),'hex');
$$;

create function public.os_review_begin(p_id uuid, p_company uuid, p_actor uuid, p_question text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare t public.os_review_turns; thread uuid; message uuid; captured_history jsonb;
begin
  perform internal.os_review_access(p_company,p_actor);
  if p_id is null or p_question is null or length(btrim(p_question)) not between 1 and 40000 then
    raise exception 'invalid review question' using errcode='check_violation';
  end if;
  select * into t from public.os_review_turns where id=p_id for update;
  if found then
    if t.company_id <> p_company or t.actor_id <> p_actor or t.question <> p_question then
      raise exception 'review request collision' using errcode='check_violation';
    end if;
    return jsonb_build_object('created',false,'turn',to_jsonb(t));
  end if;
  select id into thread from public.os_threads where company_id=p_company order by updated_at desc,id limit 1;
  if thread is null then insert into public.os_threads(company_id) values(p_company) returning id into thread; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'role',m.role,'body',m.body) order by m.created_at,m.id),'[]'::jsonb)
    into captured_history from (
      select id,role,body,created_at from public.os_messages where thread_id=thread order by created_at desc,id desc limit 40
    ) m;
  insert into public.os_messages(thread_id,role,body,actor) values(thread,'person',p_question,p_actor) returning id into message;
  insert into public.os_review_turns(id,company_id,actor_id,thread_id,person_message_id,question,history)
    values(p_id,p_company,p_actor,thread,message,p_question,captured_history) returning * into t;
  return jsonb_build_object('created',true,'turn',to_jsonb(t));
end; $$;

create function public.os_review_finish(p_id uuid, p_company uuid, p_actor uuid, p_reply text, p_status text,
  p_input_tokens integer, p_output_tokens integer, p_cost numeric)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare t public.os_review_turns; message uuid;
begin
  perform internal.os_review_access(p_company,p_actor);
  select * into t from public.os_review_turns where id=p_id and company_id=p_company and actor_id=p_actor for update;
  if not found then raise exception 'review turn unavailable' using errcode='insufficient_privilege'; end if;
  if t.status <> 'running' then return to_jsonb(t); end if;
  if p_status is null or p_status not in ('completed','failed') or p_reply is null or length(p_reply)>40000
     or coalesce(p_input_tokens,-1)<0 or coalesce(p_output_tokens,-1)<0 or coalesce(p_cost,-1)<0 then
    raise exception 'invalid review completion' using errcode='check_violation';
  end if;
  insert into public.os_messages(thread_id,role,body,input_tokens,output_tokens,cost_usd)
    values(t.thread_id,'cofounder',p_reply,p_input_tokens,p_output_tokens,p_cost) returning id into message;
  update public.os_review_turns set status=p_status,reply=p_reply,reply_message_id=message,updated_at=now() where id=p_id returning * into t;
  update public.os_threads set updated_at=now() where id=t.thread_id;
  return to_jsonb(t);
end; $$;

create function public.os_review_propose(p_id uuid, p_turn uuid, p_company uuid, p_actor uuid, p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare t public.os_review_turns; p public.os_review_proposals; src jsonb; fingerprint text;
begin
  perform internal.os_review_access(p_company,p_actor);
  select * into t from public.os_review_turns where id=p_turn and company_id=p_company and actor_id=p_actor for update;
  if not found then raise exception 'review turn unavailable' using errcode='insufficient_privilege'; end if;
  src := internal.os_review_validate(p_payload,t);
  select * into p from public.os_review_proposals where id=p_id;
  if found then
    if p.turn_id<>p_turn or p.company_id<>p_company or p.actor_id<>p_actor or p.payload<>p_payload or p.sources<>src then
      raise exception 'review proposal collision' using errcode='check_violation';
    end if;
    return to_jsonb(p);
  end if;
  select * into p from public.os_review_proposals where turn_id=p_turn and payload=p_payload and sources=src order by created_at,id limit 1;
  if found then return to_jsonb(p); end if;
  if t.status <> 'running' then raise exception 'review turn is closed' using errcode='check_violation'; end if;
  if (select count(*) from public.os_review_proposals where turn_id=p_turn)>=32 then
    raise exception 'review proposal limit reached' using errcode='check_violation';
  end if;
  fingerprint := internal.os_review_fingerprint(p_id,t,1,p_payload,src);
  insert into public.os_review_proposals(id,company_id,actor_id,turn_id,fingerprint,payload,sources)
    values(p_id,p_company,p_actor,p_turn,fingerprint,p_payload,src) returning * into p;
  insert into public.os_review_proposal_revisions(proposal_id,revision,payload,sources,fingerprint)
    values(p.id,p.revision,p.payload,p.sources,p.fingerprint);
  return to_jsonb(p);
end; $$;

-- A process can die without writing its terminal receipt. The original actor
-- may close only a running turn older than the route's 120-second limit plus
-- a full minute of margin. This is a fence, never permission to regenerate.
-- Existing suggestions survive and still need their own review. All later
-- model writes re-check the turn under the same company/turn locks.
create function public.os_review_interrupt(p_id uuid,p_company uuid,p_actor uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare t public.os_review_turns;
begin
  perform internal.os_review_access(p_company,p_actor);
  select * into t from public.os_review_turns where id=p_id and company_id=p_company and actor_id=p_actor for update;
  if not found then raise exception 'review turn unavailable' using errcode='insufficient_privilege'; end if;
  if t.status <> 'running' then return to_jsonb(t); end if;
  if t.created_at > clock_timestamp() - interval '3 minutes' then
    raise exception 'review turn may still be running; check again later' using errcode='check_violation';
  end if;
  return public.os_review_finish(p_id,p_company,p_actor,
    'Interrupted before completion could be confirmed; review stored suggestions separately.',
    'failed',0,0,0);
end; $$;

create function public.os_review_decide(p_id uuid,p_company uuid,p_actor uuid,p_revision integer,p_fingerprint text,p_action text,p_payload jsonb default null)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare p public.os_review_proposals; t public.os_review_turns; src jsonb; target uuid; provenance jsonb;
begin
  perform internal.os_review_access(p_company,p_actor);
  -- Company lock serializes sibling proposal edits/dedup and all decisions.
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
  if (p_action='save_to_work' and p.payload->>'type'<>'work') or (p_action='add_to_company_knowledge' and p.payload->>'type'<>'knowledge')
     or (p_action<>'revise' and p_payload is not null) then
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
    src := internal.os_review_validate(p_payload,t);
    if p_payload->>'type' <> p.payload->>'type' then raise exception 'review type cannot change' using errcode='check_violation'; end if;
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
  src := internal.os_review_validate(p.payload,t);
  if src<>p.sources or p.fingerprint<>internal.os_review_fingerprint(p.id,t,p.revision,p.payload,src) then
    raise exception 'review source changed' using errcode='check_violation';
  end if;
  provenance := jsonb_build_object('proposalId',p.id,'revision',p.revision,'fingerprint',p.fingerprint,
    'turnId',t.id,'threadId',t.thread_id,'authorship','model','lastEditedBy',p.last_edited_by,
    'confirmedBy',p_actor,'externallyVerified',false,'sources',src,'citations',p.payload->'citations');
  if p_action='save_to_work' then
    insert into public.os_work_items(company_id,lane,kind,title,status,required_action,notes,sources,metadata)
      values(p_company,p.payload->>'lane',p.payload->>'kind',p.payload->>'title','drafted',p.payload->>'outwardAction',
        p.payload->>'body',src,jsonb_build_object('by','cofounder','review',provenance)) returning id into target;
    insert into public.os_work_item_events(item_id,actor,event,detail)
      values(target,p_actor,'saved_from_review',provenance);
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

-- Functions default to PUBLIC EXECUTE even when role-specific defaults were
-- revoked. Explicitly close both exposed RPCs and internal validation helpers.
revoke all on function internal.os_review_access(uuid,uuid), internal.os_review_keys(jsonb,text[]), internal.os_review_text(jsonb,integer),
  internal.os_review_validate(jsonb,public.os_review_turns), internal.os_review_fingerprint(uuid,public.os_review_turns,integer,jsonb,jsonb)
  from public,anon,authenticated;
grant execute on function internal.os_review_access(uuid,uuid), internal.os_review_keys(jsonb,text[]), internal.os_review_text(jsonb,integer),
  internal.os_review_validate(jsonb,public.os_review_turns), internal.os_review_fingerprint(uuid,public.os_review_turns,integer,jsonb,jsonb) to service_role;
revoke all on function public.os_review_begin(uuid,uuid,uuid,text), public.os_review_finish(uuid,uuid,uuid,text,text,integer,integer,numeric), public.os_review_interrupt(uuid,uuid,uuid),
  public.os_review_propose(uuid,uuid,uuid,uuid,jsonb), public.os_review_decide(uuid,uuid,uuid,integer,text,text,jsonb)
  from public,anon,authenticated;
grant execute on function public.os_review_begin(uuid,uuid,uuid,text), public.os_review_finish(uuid,uuid,uuid,text,text,integer,integer,numeric), public.os_review_interrupt(uuid,uuid,uuid),
  public.os_review_propose(uuid,uuid,uuid,uuid,jsonb), public.os_review_decide(uuid,uuid,uuid,integer,text,text,jsonb) to service_role;
