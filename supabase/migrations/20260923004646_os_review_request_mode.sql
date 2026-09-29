-- Local S1f: bind the founder's selected review capability to the durable
-- question. Do not apply remotely without Mehmet's separate SQL approval.
-- Historical turns had both proposal tools available, so label them "both"
-- rather than inventing a new, narrower selection after the fact.

alter table public.os_review_turns
  add column request_mode text check (request_mode in ('ask','draft','knowledge','both'));
update public.os_review_turns set request_mode = 'both';
alter table public.os_review_turns alter column request_mode set not null;

-- The original migration grants only named INSERT columns. Keep that pattern
-- for the new field; do not grant table-wide INSERT or UPDATE.
grant insert (request_mode) on public.os_review_turns to service_role;

create function public.os_review_begin(p_id uuid, p_company uuid, p_actor uuid, p_question text, p_mode text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare t public.os_review_turns; thread uuid; message uuid; captured_history jsonb;
begin
  perform internal.os_review_access(p_company,p_actor);
  if p_id is null or p_question is null or length(btrim(p_question)) not between 1 and 40000
     or p_mode is null or p_mode not in ('ask','draft','knowledge','both') then
    raise exception 'invalid review question or mode' using errcode='check_violation';
  end if;
  select * into t from public.os_review_turns where id=p_id for update;
  if found then
    if t.company_id <> p_company or t.actor_id <> p_actor or t.question <> p_question or t.request_mode <> p_mode then
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
  insert into public.os_review_turns(id,company_id,actor_id,thread_id,person_message_id,question,history,request_mode)
    values(p_id,p_company,p_actor,thread,message,p_question,captured_history,p_mode) returning * into t;
  return jsonb_build_object('created',true,'turn',to_jsonb(t));
end; $$;

-- PostgreSQL treats a changed argument list as a distinct function. Remove
-- the four-argument overload so callers cannot bypass explicit selection.
drop function public.os_review_begin(uuid,uuid,uuid,text);
revoke all on function public.os_review_begin(uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.os_review_begin(uuid,uuid,uuid,text,text) to service_role;

create or replace function public.os_review_propose(p_id uuid, p_turn uuid, p_company uuid, p_actor uuid, p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare t public.os_review_turns; p public.os_review_proposals; src jsonb; fingerprint text;
begin
  perform internal.os_review_access(p_company,p_actor);
  select * into t from public.os_review_turns where id=p_turn and company_id=p_company and actor_id=p_actor for update;
  if not found then raise exception 'review turn unavailable' using errcode='insufficient_privilege'; end if;
  src := internal.os_review_validate(p_payload,t);
  if not (t.request_mode = 'both'
      or (t.request_mode = 'draft' and p_payload->>'type' = 'work')
      or (t.request_mode = 'knowledge' and p_payload->>'type' = 'knowledge')) then
    raise exception 'review proposal not permitted by selected mode' using errcode='check_violation';
  end if;
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

-- CREATE OR REPLACE retains the existing service-only EXECUTE ACL. Assert
-- that assumption in the SQL proof, including PUBLIC's default privileges.
