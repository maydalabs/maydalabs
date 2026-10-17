-- Slice 5 — agent runs (agreed 29 September 2026, judged 17 October 2026):
-- plan -> read -> propose several review cards, visible while it works.
--
-- A run IS a reviewed draft turn. Its id is an os_review_turns id begun through
-- os_review_begin (mode 'draft', the founder's draftFormat, the instruction as
-- the person's message in the conversation thread). Every card is an ordinary
-- os_review_proposals row on that turn, and only os_review_decide — a person —
-- turns a card into Work. Nothing in this file inserts into os_work_items or
-- os_company_memory, and nothing here approves, sends or publishes.
--
-- What a turn cannot hold lives here: who is driving (a lease), the model's
-- checkpoint, what a person watches (progress, plan, question), what the run
-- read (immutable captures — the only record text a run card may cite) and
-- what each model call cost (an append-only ledger). A run's closing message
-- carries cost 0, so a model call is counted once: in the ledger.
--
-- Money is counted by when it was spent, not by when the run began. A run
-- started on the 31st that is continued on the 2nd spends the 2nd's money.
-- A round's money belongs to the UTC day and the month its round was
-- reserved in — its hold until the call reports, then what the call cost —
-- and never moves: a call in flight across midnight or a month end, or a
-- hold charged days later when a stalled run is stopped, stays in the window
-- whose checks counted it, rather than landing in one whose checks never
-- saw it. os_chat_spent_this_month sums messages by their own timestamps
-- and rounds by their reservations. The platform-wide daily ceiling the
-- worker keeps (MAYDAOS_DAILY_USD_CAP) applies to runs too: os_agent_run_round
-- is told the cap and refuses a round that would pass it, and the worker and
-- the manual workflow run read the same day total (os_spent_today), so
-- workflows see what runs spent as runs see what workflows spent. A run on a
-- company's own key spends that company's money, not the platform's: it
-- counts in the company's day and never in the platform's, so one company
-- spending its own key cannot use up the platform's day for everyone else.
--
-- A round is held before its model call, at what it was projected to cost,
-- and the hold counts as spent until the call's own usage replaces it. A
-- call that never reports usage — stopped, timed out, its response lost, its
-- function killed — has usually been billed for its input all the same, so
-- its hold is charged as an estimate (one that errs high) before the run's
-- next round and when the run ends. A call the provider refused before
-- accepting it (a 429 or 529, a refused request, a failed connection) was
-- billed nothing: the driver reports zero usage for it at once, so its hold
-- is never charged. Two members' rounds, a stalled driver's late call and
-- the next round therefore never pass a ceiling by counting the same
-- remaining money twice.
--
-- The receipts a run writes into the conversation are computed here, from
-- the cards' current states, at the moment the run finishes or is stopped.
-- A person may save or dismiss a card while the run is still working; a
-- receipt assembled from what the model was told would then say "not saved"
-- about a card that was. The model's own text is only ever the preamble.
--
-- Lock order everywhere: company (internal.os_review_access) -> run -> turn ->
-- proposal, the same as os_review_decide; a platform-key round then takes
-- one transaction lock of its own. os_agent_run_usage locks only the run
-- row, which is why the ledger's and the holds' company_id carry no foreign
-- key: a key check would take a share lock on the company while holding the
-- run, the reverse of every other path.
--
-- Applied by the owner as one transaction-wrapped bundle. Code that reads
-- os_agent_runs, os_agent_run_reads or os_agent_run_usage deploys after it.

-- 1. Runs -------------------------------------------------------------------
create table public.os_agent_runs (
  id uuid primary key references public.os_review_turns(id),
  company_id uuid not null references public.os_companies(id),
  actor_id uuid not null references auth.users(id),
  status text not null default 'running'
    check (status in ('running','waiting','paused','completed','failed','canceled')),
  stop_reason text,
  -- Who pays decides which daily ceiling applies: the company's own key is
  -- checked against the company's spend, the platform's against everyone's,
  -- the local model against nothing because it costs nothing.
  payer text not null check (payer in ('company','platform','local')),
  priced boolean not null,
  model_label text not null check (char_length(model_label) between 1 and 200),
  ceiling_usd numeric(10,4) not null check (ceiling_usd between 0 and 5),
  seq integer not null default 0 check (seq between 0 and 5000),
  slices smallint not null default 1 check (slices between 1 and 12),
  lease_id uuid,
  lease_until timestamptz,
  rounds smallint not null default 0 check (rounds between 0 and 12),
  item_reads smallint not null default 0 check (item_reads between 0 and 12),
  cards smallint not null default 0 check (cards between 0 and 8),
  asked boolean not null default false,
  -- Running totals of the ledger below, moved in the same transaction.
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  cost_usd numeric(12,6) not null default 0 check (cost_usd >= 0),
  plan jsonb check (plan is null or jsonb_typeof(plan) = 'object'),
  question jsonb check (question is null or jsonb_typeof(question) = 'object'),
  answer text check (answer is null or char_length(answer) between 1 and 1000),
  answered_at timestamptz,
  progress jsonb not null default '[]'::jsonb
    check (jsonb_typeof(progress) = 'array' and jsonb_array_length(progress) <= 150),
  checkpoint jsonb not null default '{}'::jsonb
    check (jsonb_typeof(checkpoint) = 'object' and octet_length(checkpoint::text) <= 400000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz,
  constraint os_agent_runs_payer check ((payer = 'local') = (not priced)),
  constraint os_agent_runs_lease check (
    (lease_id is null) = (lease_until is null) and (status = 'running') = (lease_id is not null)),
  constraint os_agent_runs_end check (
    (status in ('running','waiting','paused') and stop_reason is null and finished_at is null)
    or (status = 'completed' and stop_reason in ('done','card_limit','step_limit','budget','month_budget','daily_cap','uncertain') and finished_at is not null)
    or (status = 'failed' and stop_reason in ('provider','invalid_replies','storage') and finished_at is not null)
    or (status = 'canceled' and stop_reason = 'canceled' and finished_at is not null)),
  constraint os_agent_runs_waiting check (status <> 'waiting' or (question is not null and answered_at is null)),
  constraint os_agent_runs_free check (priced or (ceiling_usd = 0 and cost_usd = 0))
);
create unique index os_agent_runs_one_open on public.os_agent_runs (company_id, actor_id)
  where status in ('running','waiting','paused');
create index os_agent_runs_company_created_idx on public.os_agent_runs (company_id, created_at desc);

-- 2. What a run read: an immutable capture of the live row, written only by SQL.
-- The capture, not the live item, is what a card cites, so a later edit of the
-- item's title cannot make os_review_decide refuse the save as "source changed".
create table public.os_agent_run_reads (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.os_agent_runs(id),
  company_id uuid not null references public.os_companies(id),
  item_id uuid not null,               -- deliberately no FK: a capture is history
  ref text not null check (ref ~ '^w[1-9][0-9]?$'),
  title text not null check (char_length(title) between 1 and 200),
  lane text not null check (char_length(lane) between 1 and 40),
  kind text not null check (char_length(kind) between 1 and 40),
  status text not null check (char_length(status) between 1 and 20),
  required_action text check (required_action is null or char_length(required_action) <= 60),
  due_on date,
  waiting_days integer not null check (waiting_days >= 0),
  item_updated_at timestamptz not null,
  source_text text not null check (char_length(source_text) between 1 and 3300),
  created_at timestamptz not null default now(),
  unique (run_id, item_id),
  unique (run_id, ref)
);
create trigger os_agent_run_reads_append_only before update or delete on public.os_agent_run_reads
  for each row execute function internal.os_event_append_only();

-- 3. Every round a run reserved, held at what it was projected to cost before
-- the model call began. Never rewritten. A hold counts as spent until the
-- ledger below has a row for the same round.
create table public.os_agent_run_rounds (
  run_id uuid not null references public.os_agent_runs(id),
  round smallint not null check (round between 1 and 12),
  company_id uuid not null,            -- copied from the locked run row; see the lock-order note above
  hold_usd numeric(12,6) not null check (hold_usd >= 0),
  reserved_at timestamptz not null default now(),
  primary key (run_id, round)
);
create index os_agent_run_rounds_company_reserved_idx on public.os_agent_run_rounds (company_id, reserved_at desc);
create index os_agent_run_rounds_reserved_idx on public.os_agent_run_rounds (reserved_at desc);
create trigger os_agent_run_rounds_append_only before update or delete on public.os_agent_run_rounds
  for each row execute function internal.os_event_append_only();

-- 4. What each reserved round cost: one row per round, never rewritten. The
-- call's own usage when it reported some, in any run status; otherwise the
-- round's hold, marked estimated, charged before the next round or when the
-- run ends (internal.os_agent_run_settle). recorded_at says when the row was
-- written; month and day sums read its round's reserved_at instead
-- (internal.os_agent_run_spend), never the run's created_at.
create table public.os_agent_run_usage (
  run_id uuid not null,
  round smallint not null check (round between 1 and 12),
  company_id uuid not null,            -- copied from the locked run row; see the lock-order note above
  input_tokens integer not null check (input_tokens >= 0),
  output_tokens integer not null check (output_tokens >= 0),
  cost_usd numeric(12,6) not null check (cost_usd >= 0),
  estimated boolean not null default false,
  recorded_at timestamptz not null default now(),
  primary key (run_id, round),
  foreign key (run_id, round) references public.os_agent_run_rounds(run_id, round)
);
create trigger os_agent_run_usage_append_only before update or delete on public.os_agent_run_usage
  for each row execute function internal.os_event_append_only();

-- 5. Guard: finished runs are frozen except late usage totals; every other
-- update is sequenced; identity, plan and counts only move forward; progress
-- is append-only. Holds for a direct service-role update too.
create function internal.os_agent_run_guard()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare usage_keys text[] := array['input_tokens','output_tokens','cost_usd','updated_at'];
begin
  if new.input_tokens < old.input_tokens or new.output_tokens < old.output_tokens or new.cost_usd < old.cost_usd then
    raise exception 'agent run usage only grows' using errcode = 'check_violation';
  end if;
  -- The usage of a model call already in flight is recorded in any status, unsequenced.
  if (to_jsonb(new) - usage_keys) = (to_jsonb(old) - usage_keys) then return new; end if;
  if old.status in ('completed','failed','canceled') then
    raise exception 'a finished agent run is frozen' using errcode = 'check_violation';
  end if;
  if new.seq <> old.seq + 1 then
    raise exception 'agent run updates are sequenced' using errcode = 'check_violation';
  end if;
  if (new.id, new.company_id, new.actor_id, new.payer, new.priced, new.model_label, new.ceiling_usd, new.created_at)
       is distinct from (old.id, old.company_id, old.actor_id, old.payer, old.priced, old.model_label, old.ceiling_usd, old.created_at)
     or (old.plan is not null and new.plan is distinct from old.plan)
     or (old.asked and not new.asked)
     or new.rounds < old.rounds or new.slices < old.slices or new.item_reads < old.item_reads or new.cards < old.cards then
    raise exception 'an agent run keeps its identity, its plan and its counts' using errcode = 'check_violation';
  end if;
  if jsonb_array_length(new.progress) < jsonb_array_length(old.progress)
     or (select coalesce(jsonb_agg(x.e order by x.i), '[]'::jsonb)
           from jsonb_array_elements(new.progress) with ordinality as x(e, i)
          where x.i <= jsonb_array_length(old.progress)) is distinct from old.progress then
    raise exception 'agent run progress is append-only' using errcode = 'check_violation';
  end if;
  return new;
end; $$;
create trigger os_agent_runs_guard before update on public.os_agent_runs
  for each row execute function internal.os_agent_run_guard();

-- 6. RLS and column grants (columns, never tables). No signed-in role writes
-- any of these tables; every write is one of the service-role RPCs below.
alter table public.os_agent_runs enable row level security;
alter table public.os_agent_run_reads enable row level security;
alter table public.os_agent_run_rounds enable row level security;
alter table public.os_agent_run_usage enable row level security;
revoke all on public.os_agent_runs, public.os_agent_run_reads, public.os_agent_run_rounds, public.os_agent_run_usage
  from public, anon, authenticated, service_role;
create policy os_agent_runs_read on public.os_agent_runs
  for select to authenticated using (public.os_is_member(company_id));
create policy os_agent_run_reads_read on public.os_agent_run_reads
  for select to authenticated using (public.os_is_member(company_id));
create policy os_agent_run_rounds_read on public.os_agent_run_rounds
  for select to authenticated using (public.os_is_member(company_id));
create policy os_agent_run_usage_read on public.os_agent_run_usage
  for select to authenticated using (public.os_is_member(company_id));
-- Members see progress, plan, question, counters and spend; never the checkpoint or the lease token.
grant select (id, company_id, actor_id, status, stop_reason, payer, priced, model_label, ceiling_usd, seq, slices, lease_until,
  rounds, item_reads, cards, asked, input_tokens, output_tokens, cost_usd, plan, question, answer, answered_at, progress,
  created_at, updated_at, finished_at) on public.os_agent_runs to authenticated;
grant select (id, company_id, actor_id, status, stop_reason, payer, priced, model_label, ceiling_usd, seq, slices, lease_id, lease_until,
  rounds, item_reads, cards, asked, input_tokens, output_tokens, cost_usd, plan, question, answer, answered_at,
  progress, checkpoint, created_at, updated_at, finished_at) on public.os_agent_runs to service_role;
grant insert (id, company_id, actor_id, payer, priced, model_label, ceiling_usd, lease_id, lease_until) on public.os_agent_runs to service_role;
grant update (status, stop_reason, seq, slices, lease_id, lease_until, rounds, item_reads, cards, asked,
  input_tokens, output_tokens, cost_usd, plan, question, answer, answered_at, progress, checkpoint, updated_at, finished_at)
  on public.os_agent_runs to service_role;
grant select (id, run_id, company_id, item_id, ref, title, lane, kind, status, required_action, due_on, waiting_days,
  item_updated_at, source_text, created_at) on public.os_agent_run_reads to authenticated, service_role;
grant insert (run_id, company_id, item_id, ref, title, lane, kind, status, required_action, due_on, waiting_days,
  item_updated_at, source_text) on public.os_agent_run_reads to service_role;
grant select (run_id, round, company_id, hold_usd, reserved_at) on public.os_agent_run_rounds to authenticated, service_role;
grant insert (run_id, round, company_id, hold_usd) on public.os_agent_run_rounds to service_role;
grant select (run_id, round, company_id, input_tokens, output_tokens, cost_usd, estimated, recorded_at)
  on public.os_agent_run_usage to authenticated, service_role;
grant insert (run_id, round, company_id, input_tokens, output_tokens, cost_usd, estimated) on public.os_agent_run_usage to service_role;

-- 7. Internal helpers.
create function internal.os_agent_run_public(r public.os_agent_runs)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select to_jsonb(r) - 'checkpoint' - 'lease_id';
$$;

-- What the rounds reserved since p_since spent, each counted once and in the
-- window that reserved it: at what its call cost once the ledger has the
-- round, at its hold until then. Reading the window from the reservation, and
-- never from when the ledger row was written, is what keeps a round's money
-- in place. A hold reserved at 23:59 is counted in yesterday's checks only.
-- Counted by when its ledger row was written — its report, or its estimate
-- at settle, at 00:01 — it would land in a day whose checks never saw it,
-- and a run that checked at 00:00 against a small cap would end the day past
-- it. The same holds for a month end, and for a hold charged days later when
-- a stalled run is stopped or continued. (Counting every unsettled hold in
-- every later window instead would also keep the money in a window that
-- counted it, but would hold a stalled, abandoned run's last round against
-- every later day and month for as long as nobody stops the run.)
--
-- A company's total is every round of that company. A null company is the
-- platform's: only rounds of runs on the platform's key, since a run on a
-- company's own key spends nothing of the platform's. The join reads the
-- run row and takes no lock.
create function internal.os_agent_run_spend(p_company uuid, p_since timestamptz)
returns numeric language sql stable security invoker set search_path = '' as $$
  select coalesce(sum(coalesce(u.cost_usd, h.hold_usd)), 0)
    from public.os_agent_run_rounds h
    left join public.os_agent_run_usage u on u.run_id = h.run_id and u.round = h.round
   where h.reserved_at >= p_since
     and case when p_company is null
              then exists (select 1 from public.os_agent_runs r where r.id = h.run_id and r.payer = 'platform')
              else h.company_id = p_company end;
$$;

-- Conversation messages by their own timestamps, plus the rounds reserved
-- this month, ledgered or in flight.
create function internal.os_agent_month_spend(p_company uuid)
returns numeric language sql stable security invoker set search_path = '' as $$
  select coalesce((select sum(m.cost_usd) from public.os_messages m join public.os_threads t on t.id = m.thread_id
                    where t.company_id = p_company and m.created_at >= date_trunc('month', now())), 0)
       + internal.os_agent_run_spend(p_company, date_trunc('month', now()));
$$;

-- Today (UTC) as the worker counts it — os_runs, per company on a company's
-- key, every workflow run on the platform's — plus the run rounds reserved
-- today, ledgered or in flight. A null company is the platform's day: every
-- workflow run, as before, and the rounds of runs on the platform's key.
create function internal.os_agent_day_spend(p_company uuid)
returns numeric language sql stable security invoker set search_path = '' as $$
  select coalesce((select sum(r.cost_usd) from public.os_runs r
                    where r.created_at >= date_trunc('day', now(), 'UTC')
                      and (p_company is null or r.company_id = p_company)), 0)
       + internal.os_agent_run_spend(p_company, date_trunc('day', now(), 'UTC'));
$$;

-- A reserved round whose call never reported usage is charged at its hold,
-- marked estimated. Called before the run's next round and when it ends — by
-- then the call is over or abandoned — with the run row already locked. A
-- late report of the same round is then ignored (recorded false): the hold,
-- projected from the whole prompt plus the most a reply may write, errs high.
-- However late the estimate is written, it counts where its hold did: in the
-- day and month the round was reserved (internal.os_agent_run_spend).
create function internal.os_agent_run_settle(p_run public.os_agent_runs)
returns public.os_agent_runs language plpgsql security invoker set search_path = '' as $$
declare r public.os_agent_runs := p_run; charged numeric;
begin
  with held as (
    insert into public.os_agent_run_usage (run_id, round, company_id, input_tokens, output_tokens, cost_usd, estimated)
    select h.run_id, h.round, h.company_id, 0, 0, h.hold_usd, true
      from public.os_agent_run_rounds h
     where h.run_id = p_run.id
       and not exists (select 1 from public.os_agent_run_usage u where u.run_id = h.run_id and u.round = h.round)
    on conflict (run_id, round) do nothing
    returning cost_usd)
  select coalesce(sum(cost_usd), 0) into charged from held;
  if charged > 0 then
    -- Usage totals only: unsequenced, as the guard allows in any status.
    update public.os_agent_runs set cost_usd = cost_usd + charged, updated_at = now()
     where id = p_run.id returning * into r;
  end if;
  return r;
end; $$;

-- A counter the driver keeps in its checkpoint (refused, faults, cutOffs),
-- read defensively: anything but a small whole number reads as zero.
create function internal.os_agent_run_counter(p_checkpoint jsonb, p_name text)
returns integer language sql immutable security invoker set search_path = '' as $$
  select case when jsonb_typeof(p_checkpoint -> 'counters' -> p_name) = 'number'
               and (p_checkpoint -> 'counters' ->> p_name) ~ '^[0-9]{1,4}$'
              then (p_checkpoint -> 'counters' ->> p_name)::integer else 0 end;
$$;

-- Company lock and membership first (os_review_access), then the run row.
create function internal.os_agent_run_lock(p_id uuid, p_company uuid, p_actor uuid)
returns public.os_agent_runs language plpgsql security invoker set search_path = '' as $$
declare r public.os_agent_runs;
begin
  perform internal.os_review_access(p_company, p_actor);
  select * into r from public.os_agent_runs where id = p_id and company_id = p_company and actor_id = p_actor for update;
  if not found then raise exception 'agent run unavailable' using errcode = 'insufficient_privilege'; end if;
  return r;
end; $$;

create function internal.os_agent_run_fenced(p_run public.os_agent_runs, p_lease uuid)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if p_run.status <> 'running' or p_lease is null or p_run.lease_id is distinct from p_lease
     or p_run.lease_until < clock_timestamp() then
    raise exception 'agent_run_fenced' using errcode = 'P0001';
  end if;
end; $$;

-- Driver-written progress: a closed vocabulary, a number and one short label;
-- SQL stamps the time. At most one 'refused' line per call, carrying the count,
-- so a reply full of refused calls cannot fill the 150-entry progress.
create function internal.os_agent_run_progress(p_entries jsonb)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare e jsonb; result jsonb := '[]'::jsonb; refused integer := 0;
begin
  if p_entries is null or p_entries = 'null'::jsonb then return result; end if;
  if jsonb_typeof(p_entries) <> 'array' or jsonb_array_length(p_entries) > 12 then
    raise exception 'invalid agent run progress' using errcode = 'check_violation';
  end if;
  for e in select value from jsonb_array_elements(p_entries) loop
    if jsonb_typeof(e) <> 'object'
       or coalesce(e->>'k','') not in ('plan','search','memory','refused','asked','paused','cut_off','fault')
       or exists (select 1 from jsonb_object_keys(e) k where k not in ('k','n','label'))
       or (e ? 'n' and (jsonb_typeof(e->'n') <> 'number' or (e->>'n')::numeric not between 0 and 10000))
       or (e ? 'label' and internal.os_review_text(e->'label', 200) is not true) then
      raise exception 'invalid agent run progress' using errcode = 'check_violation';
    end if;
    if e->>'k' = 'refused' then refused := refused + 1; end if;
    result := result || jsonb_build_array(e || jsonb_build_object('at', now()));
  end loop;
  if refused > 1 then
    raise exception 'invalid agent run progress' using errcode = 'check_violation';
  end if;
  return result;
end; $$;

-- The trusted receipt: the cards' states as they stand now, counted here,
-- never what the driver remembers. Only the run's starter can decide its
-- cards (os_review_decide binds the actor), so "by the member who started
-- the run" is exact for every reader of the shared conversation.
create function internal.os_agent_run_receipt(p_run public.os_agent_runs, p_refused integer, p_faults integer)
returns text language plpgsql stable security invoker set search_path = '' as $$
declare total integer; waiting integer; saved integer; dismissed integer; reason text;
begin
  select count(*), count(*) filter (where p.status = 'proposed'), count(*) filter (where p.status = 'saved'),
         count(*) filter (where p.status = 'dismissed')
    into total, waiting, saved, dismissed
    from public.os_review_proposals p where p.turn_id = p_run.id;
  reason := case p_run.stop_reason
    when 'done' then 'it finished'
    when 'card_limit' then 'it reached its limit of eight cards'
    when 'step_limit' then 'it used all its model steps'
    when 'budget' then 'its next step could have passed this run''s spending limit'
    when 'month_budget' then 'its next step could have passed this month''s conversation budget'
    when 'daily_cap' then 'its next step could have passed today''s spending limit'
    when 'uncertain' then 'a card could not be confirmed, so it prepared no more'
    when 'provider' then 'the model could not finish'
    when 'invalid_replies' then 'the model kept asking for too much at once'
    when 'storage' then 'storage refused a step, so it stopped'
    when 'canceled' then 'the member who started it stopped it'
    else 'unknown' end;
  return concat_ws(E'\n',
    case when total = 0 then 'Run receipt — this run prepared no cards.'
      else format('Run receipt — cards prepared: %s (waiting for a decision: %s; saved to Work by the member who started the run: %s; dismissed by that member: %s).',
        total, waiting, saved, dismissed) end,
    'Only the member who started the run can decide its cards. The run itself saved, approved, sent and published nothing.',
    format('Model steps: %s of at most 12; records read: %s; stopped: %s.', p_run.rounds, p_run.item_reads, reason),
    case when p_refused > 0 then format('Refused attempts during the run: %s. Nothing was staged from them.', p_refused) end,
    case when p_faults > 0 then format('Model replies set aside unused: %s. Nothing from them was done.', p_faults) end,
    case when p_run.stop_reason = 'uncertain' then
      'Some results are unconfirmed. Refresh to check the cards before trying again; nothing was retried automatically.' end);
end; $$;

-- A run card cites exactly [the instruction, one capture of THIS run]; quotes are substrings.
create function internal.os_agent_run_validate(p_payload jsonb, p_turn public.os_review_turns, p_message public.os_messages)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare founder jsonb; captured jsonb; x public.os_agent_run_reads;
begin
  if jsonb_typeof(p_payload) is distinct from 'object' or jsonb_typeof(p_payload->'citations') is distinct from 'array' then
    raise exception 'invalid review payload' using errcode = 'check_violation';
  end if;
  if p_payload->>'type' = 'knowledge' then
    raise exception 'review_knowledge_assertion' using errcode = 'P0001';
  end if;
  if p_payload->>'type' is distinct from 'work' then
    raise exception 'invalid review proposal type' using errcode = 'check_violation';
  end if;
  if p_turn.request_mode <> 'draft' or p_payload->>'kind' is distinct from p_turn.request_intent->>'draftFormat' then
    raise exception 'review_draft_format' using errcode = 'P0001';
  end if;
  if jsonb_array_length(p_payload->'citations') <> 2 then
    raise exception 'review citation does not match founder source' using errcode = 'check_violation';
  end if;
  founder := p_payload->'citations'->0;
  captured := p_payload->'citations'->1;
  if internal.os_review_keys(founder, array['sourceId','quote']) is not true
     or internal.os_review_text(founder->'quote', 8000) is not true
     or founder->>'sourceId' is distinct from p_message.id::text or strpos(p_message.body, founder->>'quote') = 0
     or internal.os_review_keys(captured, array['sourceId','quote']) is not true
     or internal.os_review_text(captured->'quote', 8000) is not true
     or coalesce(captured->>'sourceId','') !~ '^read:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    raise exception 'review citation does not match founder source' using errcode = 'check_violation';
  end if;
  select * into x from public.os_agent_run_reads
   where id = substr(captured->>'sourceId', 6)::uuid and run_id = p_turn.id and company_id = p_turn.company_id;
  if not found or strpos(x.source_text, captured->>'quote') = 0 then
    raise exception 'review citation does not match a record this run read' using errcode = 'check_violation';
  end if;
  if internal.os_review_keys(p_payload, array['type','title','body','lane','kind','outwardAction','citations']) is not true
     or internal.os_review_text(p_payload->'title', 200) is not true or internal.os_review_text(p_payload->'body', 8000) is not true
     or internal.os_review_text(p_payload->'lane', 40) is not true or internal.os_review_text(p_payload->'kind', 40) is not true
     or (p_payload->'outwardAction' <> 'null'::jsonb and internal.os_review_text(p_payload->'outwardAction', 60) is not true) then
    raise exception 'invalid work proposal' using errcode = 'check_violation';
  end if;
  return jsonb_build_array(
    jsonb_build_object('id', p_message.id::text, 'companyId', p_turn.company_id,
      'revision', encode(sha256(convert_to(p_message.body, 'UTF8')), 'hex'), 'text', p_message.body, 'origin', 'founder'),
    jsonb_build_object('id', 'read:' || x.id::text, 'companyId', p_turn.company_id,
      'revision', encode(sha256(convert_to(x.source_text, 'UTF8')), 'hex'), 'text', x.source_text, 'origin', 'record'));
end; $$;

-- 8. Replaced in place (grants kept by create or replace).
-- 8a. os_review_validate: the 20260927065857 body, unchanged except ONE inserted
-- early return for run turns (tests/osAgentRunMigration.test.ts asserts this).
-- The chat path never reaches the block: a chat turn has no run row.
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
  -- BEGIN agent runs (20261017200000): a run's card cites the instruction and one record this run read.
  if exists (select 1 from public.os_agent_runs where id = p_turn.id) then
    return internal.os_agent_run_validate(p_payload, p_turn, m);
  end if;
  -- END agent runs
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

-- 8b. os_review_interrupt: the 20260922160310 body plus one refusal. A run's turn
-- legitimately stays open for minutes or days; it closes only through the run.
create or replace function public.os_review_interrupt(p_id uuid,p_company uuid,p_actor uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare t public.os_review_turns;
begin
  perform internal.os_review_access(p_company,p_actor);
  if exists (select 1 from public.os_agent_runs where id = p_id) then
    raise exception 'agent_run_cancel_instead' using errcode = 'P0001';
  end if;
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

-- 8c. Monthly co-founder spend = conversation messages + run ledger rows, each
-- by its own timestamp. Same signature, same definer posture and membership
-- rule as 20260916260000; search_path tightened, every name qualified. The
-- chat route's existing 402 check therefore sees run spend with no code change.
create or replace function public.os_chat_spent_this_month(p_company_id uuid)
returns numeric language sql stable security definer set search_path = '' as $$
  select case when public.os_is_member(p_company_id) then internal.os_agent_month_spend(p_company_id) else 0 end::numeric;
$$;

-- 9. Run RPCs (service_role only; routes pass verified claims as p_actor).
-- What a priced run may spend is the run cap clamped to what this month and
-- today still have, so a run that could not afford a model step when it is
-- started never begins: no instruction is posted for a run that cannot run.
-- The check is a moment, not a reservation. Spending that lands after it —
-- another member's run, the worker — can still stop a run at its first round;
-- nothing is held for that round, and the finish says the run stopped before
-- its first model step.
--
-- What "afford" means depends on the price, so the caller says it:
-- p_min_usd is what the fewest rounds that can stage one card (search,
-- read, propose) would be held at, projected from this run's own first
-- round at this run's price — the projection os_agent_run_round will be
-- given for every round (lib/osAgentRun.ts runStartMinimumUsd). A ceiling
-- below it, or below ten cents whatever the price, is refused before
-- anything is written. A fixed floor alone let a dear model begin with a
-- ceiling its first round could not pay for: the instruction was posted, the
-- first round stopped for 'budget', and the conversation held a run that
-- never asked the model anything. An unpriced local run costs nothing, so
-- neither applies to it.
create function public.os_agent_run_start(p_id uuid, p_company uuid, p_actor uuid, p_instruction text,
  p_draft_format text, p_payer text, p_model_label text, p_cap_usd numeric, p_daily_cap numeric, p_min_usd numeric,
  p_lease_seconds integer)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare r public.os_agent_runs; began jsonb; v_cap numeric; v_ceiling numeric := 0;
begin
  perform internal.os_review_access(p_company, p_actor);
  select * into r from public.os_agent_runs where id = p_id;
  if found then
    if r.company_id <> p_company or r.actor_id <> p_actor then
      raise exception 'agent run collision' using errcode = 'check_violation';
    end if;
    return jsonb_build_object('created', false, 'run', internal.os_agent_run_public(r));
  end if;
  if p_id is null or p_instruction is null or char_length(btrim(p_instruction)) not between 1 and 2000
     or p_draft_format is null or p_draft_format not in ('email','reply','post','note','research','decision')
     or p_payer is null or p_payer not in ('company','platform','local')
     or p_model_label is null or char_length(p_model_label) not between 1 and 200
     or p_cap_usd is null or p_cap_usd not between 0 and 5
     or p_daily_cap is null or p_daily_cap < 0
     or p_min_usd is null or p_min_usd < 0
     or p_lease_seconds is null or p_lease_seconds not between 60 and 2400 then
    raise exception 'agent_run_request' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.os_review_turns where id = p_id) then
    raise exception 'agent run collision' using errcode = 'check_violation';   -- the id names a chat turn
  end if;
  if exists (select 1 from public.os_agent_runs where company_id = p_company and actor_id = p_actor
               and status in ('running','waiting','paused')) then
    raise exception 'agent_run_active' using errcode = 'P0001';
  end if;
  if p_payer <> 'local' then
    select monthly_chat_usd into v_cap from public.os_companies where id = p_company;
    v_ceiling := round(least(p_cap_usd, coalesce(v_cap, 0) - internal.os_agent_month_spend(p_company),
      p_daily_cap - internal.os_agent_day_spend(case when p_payer = 'company' then p_company end)), 4);
    if v_ceiling < greatest(0.10, p_min_usd) then raise exception 'agent_run_budget' using errcode = 'P0001'; end if;
  end if;
  began := public.os_review_begin(p_id, p_company, p_actor, p_instruction, 'draft',
    jsonb_build_object('draftFormat', p_draft_format, 'knowledgeAssertion', null));
  insert into public.os_agent_runs (id, company_id, actor_id, payer, priced, model_label, ceiling_usd, lease_id, lease_until)
    values (p_id, p_company, p_actor, p_payer, p_payer <> 'local', p_model_label, v_ceiling,
            pg_catalog.gen_random_uuid(), clock_timestamp() + make_interval(secs => p_lease_seconds))
    returning * into r;
  return jsonb_build_object('created', true, 'run', internal.os_agent_run_public(r), 'lease', r.lease_id, 'turn', began->'turn');
end; $$;

-- Reserve one model round and hold its projection, or say which limit stops
-- it: this run's ceiling, this month's budget or today's cap. A run that
-- cannot afford the next round stops; it is never refused into a stall. The
-- projection has no upper bound of its own: a company that priced its model
-- at the table's maximum simply reaches its ceiling sooner.
--
-- Every hold of the company is counted under the company lock, so two
-- members' runs take turns and each sees the other's call in flight. Rounds
-- on the platform's key are checked against the platform's day — every
-- company's rounds on that key — so they also take turns on one transaction
-- lock, taken after the company and the run (the same order everywhere, so
-- no cycle). A round on a company's own key is checked against that
-- company's day alone, which its company lock already serialises.
create function public.os_agent_run_round(p_id uuid, p_company uuid, p_actor uuid, p_lease uuid, p_seq integer,
  p_projected_usd numeric, p_daily_cap numeric)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare r public.os_agent_runs; v_cap numeric; v_stop text;
begin
  r := internal.os_agent_run_lock(p_id, p_company, p_actor);
  perform internal.os_agent_run_fenced(r, p_lease);
  if r.seq <> p_seq then raise exception 'agent_run_fenced' using errcode = 'P0001'; end if;
  if p_projected_usd is null or p_projected_usd < 0 or (not r.priced and p_projected_usd <> 0)
     or p_daily_cap is null or p_daily_cap < 0 then
    raise exception 'invalid agent run projection' using errcode = 'check_violation';
  end if;
  -- The previous round's call is over or abandoned by now: charge it if it never reported.
  r := internal.os_agent_run_settle(r);
  if r.rounds >= 12 then return jsonb_build_object('go', false, 'stop', 'step_limit', 'seq', r.seq); end if;
  if r.priced then
    if r.payer = 'platform' then
      perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('maydaos:agent_run_round:platform', 0));
    end if;
    select monthly_chat_usd into v_cap from public.os_companies where id = r.company_id;
    v_stop := case
      when r.cost_usd + p_projected_usd > r.ceiling_usd then 'budget'
      when internal.os_agent_month_spend(r.company_id) + p_projected_usd > coalesce(v_cap, 0) then 'month_budget'
      when internal.os_agent_day_spend(case when r.payer = 'company' then r.company_id end) + p_projected_usd > p_daily_cap then 'daily_cap'
    end;
    if v_stop is not null then return jsonb_build_object('go', false, 'stop', v_stop, 'seq', r.seq); end if;
  end if;
  insert into public.os_agent_run_rounds (run_id, round, company_id, hold_usd)
    values (r.id, r.rounds + 1, r.company_id, p_projected_usd);
  update public.os_agent_runs set rounds = rounds + 1, seq = seq + 1, updated_at = now()
   where id = p_id returning * into r;
  return jsonb_build_object('go', true, 'round', r.rounds, 'seq', r.seq);
end; $$;

-- The call's own usage, once per reserved round, in ANY status: the hold is
-- replaced by what the provider reported. A round already charged at its
-- hold (internal.os_agent_run_settle) keeps the hold. The bound is what the
-- most expensive price a company may record (1000 per million,
-- os_model_settings) would charge for these tokens: a real call is never
-- refused for being expensive.
create function public.os_agent_run_usage(p_id uuid, p_round integer, p_input integer, p_output integer, p_cost numeric)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare r public.os_agent_runs; inserted integer;
begin
  if p_round is null or p_input is null or p_input < 0 or p_output is null or p_output < 0
     or p_cost is null or p_cost < 0 or p_cost > round((p_input::numeric + p_output) / 1000, 6) + 0.000001 then
    raise exception 'invalid agent run usage' using errcode = 'check_violation';
  end if;
  select * into r from public.os_agent_runs where id = p_id for update;
  if not found or (not r.priced and p_cost <> 0)
     or not exists (select 1 from public.os_agent_run_rounds h where h.run_id = p_id and h.round = p_round) then
    raise exception 'invalid agent run usage' using errcode = 'check_violation';
  end if;
  insert into public.os_agent_run_usage (run_id, round, company_id, input_tokens, output_tokens, cost_usd)
    values (r.id, p_round, r.company_id, p_input, p_output, p_cost)
    on conflict (run_id, round) do nothing;
  get diagnostics inserted = row_count;
  if inserted = 0 then return jsonb_build_object('recorded', false); end if;
  update public.os_agent_runs set input_tokens = input_tokens + p_input, output_tokens = output_tokens + p_output,
         cost_usd = cost_usd + p_cost, updated_at = now()
   where id = p_id;
  return jsonb_build_object('recorded', true);
end; $$;

-- One checkpoint under (lease, seq). Optional: the plan (once), driver progress, and a transition.
create function public.os_agent_run_step(p_id uuid, p_company uuid, p_actor uuid, p_lease uuid, p_seq integer, p_patch jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare r public.os_agent_runs; t jsonb; q jsonb;
begin
  r := internal.os_agent_run_lock(p_id, p_company, p_actor);
  perform internal.os_agent_run_fenced(r, p_lease);
  if r.seq <> p_seq then raise exception 'agent_run_fenced' using errcode = 'P0001'; end if;
  if jsonb_typeof(p_patch) is distinct from 'object' or jsonb_typeof(p_patch->'checkpoint') is distinct from 'object'
     or exists (select 1 from jsonb_object_keys(p_patch) k where k not in ('checkpoint','plan','progress','transition')) then
    raise exception 'invalid agent run step' using errcode = 'check_violation';
  end if;
  if p_patch ? 'plan' then
    if r.plan is not null then raise exception 'agent_run_plan_once' using errcode = 'P0001'; end if;
    if internal.os_review_keys(p_patch->'plan', array['steps','refs']) is not true
       or jsonb_typeof(p_patch#>'{plan,steps}') is distinct from 'array'
       or jsonb_array_length(p_patch#>'{plan,steps}') not between 1 and 6
       or exists (select 1 from jsonb_array_elements(p_patch#>'{plan,steps}') s where internal.os_review_text(s, 160) is not true)
       or jsonb_typeof(p_patch#>'{plan,refs}') is distinct from 'array'
       or jsonb_array_length(p_patch#>'{plan,refs}') > 8
       or exists (select 1 from jsonb_array_elements(p_patch#>'{plan,refs}') x
                   where jsonb_typeof(x) <> 'string' or (x #>> '{}') !~ '^w[1-9][0-9]?$')
       or (select count(*) <> count(distinct value) from jsonb_array_elements(p_patch#>'{plan,refs}')) then
      raise exception 'invalid agent run plan' using errcode = 'check_violation';
    end if;
  end if;
  t := nullif(p_patch->'transition', 'null'::jsonb);
  if t is not null then
    if t->>'to' = 'waiting' then
      q := t->'question';
      if r.asked then raise exception 'agent_run_already_asked' using errcode = 'P0001'; end if;
      if internal.os_review_keys(t, array['to','question']) is not true
         or internal.os_review_keys(q, array['text','why','options']) is not true
         or internal.os_review_text(q->'text', 300) is not true
         or (q->'why' <> 'null'::jsonb and internal.os_review_text(q->'why', 300) is not true)
         or jsonb_typeof(q->'options') is distinct from 'array' or jsonb_array_length(q->'options') > 3
         or exists (select 1 from jsonb_array_elements(q->'options') o where internal.os_review_text(o, 80) is not true) then
        raise exception 'invalid agent run question' using errcode = 'check_violation';
      end if;
    elsif not (t->>'to' = 'paused' and internal.os_review_keys(t, array['to'])) then
      raise exception 'invalid agent run transition' using errcode = 'check_violation';
    end if;
  end if;
  update public.os_agent_runs set seq = seq + 1, checkpoint = p_patch->'checkpoint',
    plan = case when p_patch ? 'plan' then p_patch->'plan' else plan end,
    progress = progress || internal.os_agent_run_progress(p_patch->'progress'),
    status = case t->>'to' when 'waiting' then 'waiting' when 'paused' then 'paused' else status end,
    question = case when t->>'to' = 'waiting' then q else question end,
    asked = asked or coalesce(t->>'to' = 'waiting', false),
    answer = case when t->>'to' = 'waiting' then null else answer end,
    answered_at = case when t->>'to' = 'waiting' then null else answered_at end,
    lease_id = case when t is null then lease_id else null end,
    lease_until = case when t is null then lease_until else null end,
    updated_at = now()
   where id = p_id returning * into r;
  return jsonb_build_object('seq', r.seq, 'status', r.status);
end; $$;

-- Capture one company work item for this run. The same item returns the same
-- capture (no count). waiting_days is the os_needs_you rounding, ::integer.
-- Both answers carry the run's own read count, as propose carries its card
-- count: a driver whose first attempt committed but lost its response learns
-- the count from SQL instead of keeping one of its own that is one short.
create function public.os_agent_run_read(p_id uuid, p_company uuid, p_actor uuid, p_lease uuid, p_item uuid, p_ref text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare r public.os_agent_runs; w public.os_work_items; x public.os_agent_run_reads;
begin
  r := internal.os_agent_run_lock(p_id, p_company, p_actor);
  perform internal.os_agent_run_fenced(r, p_lease);
  select * into x from public.os_agent_run_reads where run_id = p_id and item_id = p_item;
  if found then
    if x.ref is distinct from p_ref then raise exception 'agent run read collision' using errcode = 'check_violation'; end if;
    return jsonb_build_object('created', false, 'read', to_jsonb(x), 'seq', r.seq, 'item_reads', r.item_reads);
  end if;
  if p_item is null or p_ref is null or p_ref !~ '^w[1-9][0-9]?$' then
    raise exception 'agent_run_request' using errcode = 'P0001';
  end if;
  if r.item_reads >= 12 then raise exception 'agent_run_read_limit' using errcode = 'P0001'; end if;
  select * into w from public.os_work_items where id = p_item and company_id = r.company_id;
  if not found then raise exception 'agent_run_item_unavailable' using errcode = 'P0001'; end if;
  insert into public.os_agent_run_reads (run_id, company_id, item_id, ref, title, lane, kind, status, required_action,
      due_on, waiting_days, item_updated_at, source_text)
    values (r.id, r.company_id, w.id, p_ref, w.title, w.lane, w.kind, w.status, w.required_action, w.due_on,
      greatest(0, (extract(epoch from (now() - w.updated_at)) / 86400)::integer),
      w.updated_at,
      w.title || case when btrim(w.notes) = '' then '' else E'\n\n' || left(w.notes, 3000) end)
    returning * into x;
  update public.os_agent_runs set item_reads = item_reads + 1, seq = seq + 1, updated_at = now(),
    progress = progress || jsonb_build_array(jsonb_build_object('k', 'read', 'label', x.title, 'n', x.waiting_days, 'at', now()))
   where id = p_id returning * into r;
  return jsonb_build_object('created', true, 'read', to_jsonb(x), 'seq', r.seq, 'item_reads', r.item_reads);
end; $$;

-- Stage one card about one capture. A planned id that already exists on this
-- run's turn is returned as it stands: a direct read, never a second call to
-- os_review_propose, because the person may have revised the card since and
-- every later revision is theirs. One card per capture; eight per run; an item
-- whose earlier run card is still undecided is refused. os_review_propose
-- re-validates everything else (intent, format, both sources).
create function public.os_agent_run_propose(p_id uuid, p_company uuid, p_actor uuid, p_lease uuid,
  p_proposal uuid, p_read uuid, p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare r public.os_agent_runs; t public.os_review_turns; x public.os_agent_run_reads; existing public.os_review_proposals; p jsonb;
begin
  r := internal.os_agent_run_lock(p_id, p_company, p_actor);
  perform internal.os_agent_run_fenced(r, p_lease);
  select * into existing from public.os_review_proposals where id = p_proposal;
  if found then
    if existing.turn_id <> p_id or existing.company_id <> p_company then
      raise exception 'agent run proposal collision' using errcode = 'check_violation';
    end if;
    return jsonb_build_object('created', false, 'seq', r.seq, 'cards', r.cards, 'proposal', to_jsonb(existing));
  end if;
  select * into x from public.os_agent_run_reads where id = p_read and run_id = p_id;
  if not found then raise exception 'agent_run_read_required' using errcode = 'P0001'; end if;
  select * into t from public.os_review_turns where id = p_id;
  if p_payload->'citations' is distinct from jsonb_build_array(
       jsonb_build_object('sourceId', t.person_message_id::text, 'quote', t.question),
       jsonb_build_object('sourceId', 'read:' || x.id::text, 'quote', x.title))
     or p_payload->>'lane' is distinct from x.lane then
    raise exception 'agent_run_citations' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.os_review_proposals where turn_id = p_id
               and payload->'citations'->1->>'sourceId' = 'read:' || x.id::text) then
    raise exception 'agent_run_item_carded' using errcode = 'P0001';
  end if;
  if r.cards >= 8 then raise exception 'agent_run_card_limit' using errcode = 'P0001'; end if;
  if exists (select 1 from public.os_review_proposals op
               join public.os_agent_run_reads orr on op.payload->'citations'->1->>'sourceId' = 'read:' || orr.id::text
              where op.company_id = r.company_id and op.status = 'proposed'
                and orr.company_id = r.company_id and orr.item_id = x.item_id and orr.run_id <> p_id) then
    raise exception 'agent_run_open_card' using errcode = 'P0001';
  end if;
  p := public.os_review_propose(p_proposal, p_id, p_company, p_actor, p_payload);
  if p->>'id' is distinct from p_proposal::text then
    raise exception 'agent run proposal collision' using errcode = 'check_violation';
  end if;
  update public.os_agent_runs set cards = cards + 1, seq = seq + 1, updated_at = now(),
    progress = progress || jsonb_build_array(jsonb_build_object('k', 'card', 'label', left(p_payload->>'title', 200), 'at', now()))
   where id = p_id returning * into r;
  return jsonb_build_object('created', true, 'seq', r.seq, 'cards', r.cards, 'proposal', p);
end; $$;

-- Finish by the lease holder: terminal status, then the turn's single reply —
-- the model's text first, then the receipt counted here (cost 0: the ledger
-- already holds every call, and a round that never reported is charged at
-- its hold now). The driver passes only what it alone knows: the text and
-- how many attempts were refused or replies set aside, both kept in its
-- checkpoint so a Continue does not reset them.
create function public.os_agent_run_finish(p_id uuid, p_company uuid, p_actor uuid, p_lease uuid, p_seq integer,
  p_status text, p_stop_reason text, p_text text, p_refused integer, p_faults integer)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare r public.os_agent_runs; reply text;
begin
  r := internal.os_agent_run_lock(p_id, p_company, p_actor);
  if r.status in ('completed','failed','canceled') then
    return jsonb_build_object('run', internal.os_agent_run_public(r));
  end if;
  perform internal.os_agent_run_fenced(r, p_lease);
  if r.seq <> p_seq then raise exception 'agent_run_fenced' using errcode = 'P0001'; end if;
  if not ((p_status = 'completed' and p_stop_reason in ('done','card_limit','step_limit','budget','month_budget','daily_cap','uncertain'))
       or (p_status = 'failed' and p_stop_reason in ('provider','invalid_replies','storage')))
     or p_text is null or char_length(p_text) > 4000
     or p_refused is null or p_refused not between 0 and 10000 or p_faults is null or p_faults not between 0 and 10000 then
    raise exception 'invalid agent run completion' using errcode = 'check_violation';
  end if;
  r := internal.os_agent_run_settle(r);
  update public.os_agent_runs set status = p_status, stop_reason = p_stop_reason, seq = seq + 1,
    lease_id = null, lease_until = null, finished_at = now(), updated_at = now(),
    progress = progress || jsonb_build_array(jsonb_build_object('k', case when p_status = 'failed' then 'failed' else 'finished' end, 'at', now()))
   where id = p_id returning * into r;
  -- With no text of its own, say why: a run stopped before its first model
  -- step never asked the model anything, so it is not said to have been silent.
  reply := concat_ws(E'\n\n',
    nullif(btrim(p_text), ''),
    case when p_status = 'failed' then '[Interrupted: this answer is incomplete. Review stored suggestions separately.]' end,
    case when btrim(p_text) = '' and r.rounds = 0 then 'The run stopped before its first model step.'
         when btrim(p_text) = '' then 'The model gave no summary of its own; the receipt below is what the run did.' end,
    internal.os_agent_run_receipt(r, p_refused, p_faults));
  perform public.os_review_finish(p_id, p_company, p_actor, reply, p_status, 0, 0, 0);
  return jsonb_build_object('run', internal.os_agent_run_public(r));
end; $$;

-- Stop: the run's actor only, in any open state, at once. A model call in
-- flight is charged at its hold now (the driver's watcher aborts it within
-- one interval, so its own usage would never arrive); nothing else runs. The
-- receipt carries the refusal and fault counts of the last checkpoint, as a
-- finish would.
create function public.os_agent_run_cancel(p_id uuid, p_company uuid, p_actor uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare r public.os_agent_runs;
begin
  r := internal.os_agent_run_lock(p_id, p_company, p_actor);
  if r.status in ('completed','failed','canceled') then
    return jsonb_build_object('run', internal.os_agent_run_public(r));
  end if;
  r := internal.os_agent_run_settle(r);
  update public.os_agent_runs set status = 'canceled', stop_reason = 'canceled', seq = seq + 1,
    lease_id = null, lease_until = null, finished_at = now(), updated_at = now(),
    progress = progress || jsonb_build_array(jsonb_build_object('k', 'stopped', 'at', now()))
   where id = p_id returning * into r;
  perform public.os_review_finish(p_id, p_company, p_actor,
    concat_ws(E'\n\n', 'Run stopped by the member who started it.',
      internal.os_agent_run_receipt(r, internal.os_agent_run_counter(r.checkpoint, 'refused'),
        internal.os_agent_run_counter(r.checkpoint, 'faults') + internal.os_agent_run_counter(r.checkpoint, 'cutOffs'))),
    'failed', 0, 0, 0);
  return jsonb_build_object('run', internal.os_agent_run_public(r));
end; $$;

-- A slice that ends without knowing what storage did gives its lease up at
-- once, so the run reads as stalled now — the person can continue or stop it
-- — rather than as working until the lease would have run out (330 s hosted,
-- half an hour locally). Only the current, live lease can be given up; a
-- finished, paused or already expired run is left exactly as it is.
create function public.os_agent_run_release(p_id uuid, p_company uuid, p_actor uuid, p_lease uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare r public.os_agent_runs;
begin
  r := internal.os_agent_run_lock(p_id, p_company, p_actor);
  if r.status <> 'running' or p_lease is null or r.lease_id is distinct from p_lease or r.lease_until <= clock_timestamp() then
    return jsonb_build_object('released', false, 'seq', r.seq);
  end if;
  update public.os_agent_runs set lease_until = clock_timestamp(), seq = seq + 1, updated_at = now()
   where id = p_id returning * into r;
  return jsonb_build_object('released', true, 'seq', r.seq);
end; $$;

-- Spent today, as every daily ceiling counts it: workflow runs, and the run
-- rounds reserved today, ledgered or in flight. The worker and the manual
-- workflow run read it here, os_agent_run_round reads the same function, so
-- no path counts without the others. A null company is the platform's day:
-- every workflow run and the runs on the platform's key, never a run on a
-- company's own key.
create function public.os_spent_today(p_company uuid)
returns numeric language sql stable security invoker set search_path = '' as $$
  select internal.os_agent_day_spend(p_company);
$$;

-- Continue (paused, or running with an expired lease = stalled) or answer/skip (waiting). Actor only.
create function public.os_agent_run_resume(p_id uuid, p_company uuid, p_actor uuid, p_seq integer,
  p_action text, p_answer text, p_lease_seconds integer)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare r public.os_agent_runs; v_kind text;
begin
  r := internal.os_agent_run_lock(p_id, p_company, p_actor);
  if r.seq <> p_seq then raise exception 'agent_run_stale' using errcode = 'P0001'; end if;
  if p_lease_seconds is null or p_lease_seconds not between 60 and 2400
     or p_action is null or p_action not in ('continue','answer','skip')
     or (p_action = 'answer') <> (p_answer is not null)
     or (p_answer is not null and char_length(btrim(p_answer)) not between 1 and 1000) then
    raise exception 'agent_run_request' using errcode = 'P0001';
  end if;
  if r.slices >= 12 then raise exception 'agent_run_slice_limit' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.os_review_turns where id = p_id and status = 'running') then
    raise exception 'agent_run_not_resumable' using errcode = 'P0001';
  end if;
  if r.status = 'waiting' and p_action in ('answer','skip') then
    v_kind := case when p_action = 'answer' then 'answered' else 'skipped' end;
  elsif p_action = 'continue' and (r.status = 'paused' or (r.status = 'running' and r.lease_until < clock_timestamp())) then
    v_kind := 'resumed';
  else
    raise exception 'agent_run_not_resumable' using errcode = 'P0001';
  end if;
  update public.os_agent_runs set status = 'running',
    answer = case when p_action = 'answer' then btrim(p_answer) else answer end,
    answered_at = case when v_kind in ('answered','skipped') then now() else answered_at end,
    lease_id = pg_catalog.gen_random_uuid(), lease_until = clock_timestamp() + make_interval(secs => p_lease_seconds),
    slices = slices + 1, seq = seq + 1, updated_at = now(),
    progress = progress || jsonb_build_array(jsonb_build_object('k', v_kind, 'at', now()))
   where id = p_id returning * into r;
  return jsonb_build_object('run', internal.os_agent_run_public(r), 'lease', r.lease_id);
end; $$;

-- 10. Execute grants. Functions default to PUBLIC EXECUTE: close every new one.
revoke all on function internal.os_agent_run_guard(), internal.os_agent_run_public(public.os_agent_runs),
  internal.os_agent_run_spend(uuid,timestamptz), internal.os_agent_month_spend(uuid), internal.os_agent_day_spend(uuid),
  internal.os_agent_run_settle(public.os_agent_runs), internal.os_agent_run_counter(jsonb,text),
  internal.os_agent_run_lock(uuid,uuid,uuid), internal.os_agent_run_fenced(public.os_agent_runs,uuid), internal.os_agent_run_progress(jsonb),
  internal.os_agent_run_receipt(public.os_agent_runs,integer,integer),
  internal.os_agent_run_validate(jsonb,public.os_review_turns,public.os_messages)
  from public, anon, authenticated;
grant execute on function internal.os_agent_run_public(public.os_agent_runs),
  internal.os_agent_run_spend(uuid,timestamptz), internal.os_agent_month_spend(uuid), internal.os_agent_day_spend(uuid),
  internal.os_agent_run_settle(public.os_agent_runs), internal.os_agent_run_counter(jsonb,text),
  internal.os_agent_run_lock(uuid,uuid,uuid), internal.os_agent_run_fenced(public.os_agent_runs,uuid), internal.os_agent_run_progress(jsonb),
  internal.os_agent_run_receipt(public.os_agent_runs,integer,integer),
  internal.os_agent_run_validate(jsonb,public.os_review_turns,public.os_messages)
  to service_role;
revoke all on function
  public.os_agent_run_start(uuid,uuid,uuid,text,text,text,text,numeric,numeric,numeric,integer),
  public.os_agent_run_round(uuid,uuid,uuid,uuid,integer,numeric,numeric),
  public.os_agent_run_usage(uuid,integer,integer,integer,numeric),
  public.os_agent_run_step(uuid,uuid,uuid,uuid,integer,jsonb),
  public.os_agent_run_read(uuid,uuid,uuid,uuid,uuid,text),
  public.os_agent_run_propose(uuid,uuid,uuid,uuid,uuid,uuid,jsonb),
  public.os_agent_run_finish(uuid,uuid,uuid,uuid,integer,text,text,text,integer,integer),
  public.os_agent_run_cancel(uuid,uuid,uuid),
  public.os_agent_run_release(uuid,uuid,uuid,uuid),
  public.os_agent_run_resume(uuid,uuid,uuid,integer,text,text,integer),
  public.os_spent_today(uuid)
  from public, anon, authenticated;
grant execute on function
  public.os_agent_run_start(uuid,uuid,uuid,text,text,text,text,numeric,numeric,numeric,integer),
  public.os_agent_run_round(uuid,uuid,uuid,uuid,integer,numeric,numeric),
  public.os_agent_run_usage(uuid,integer,integer,integer,numeric),
  public.os_agent_run_step(uuid,uuid,uuid,uuid,integer,jsonb),
  public.os_agent_run_read(uuid,uuid,uuid,uuid,uuid,text),
  public.os_agent_run_propose(uuid,uuid,uuid,uuid,uuid,uuid,jsonb),
  public.os_agent_run_finish(uuid,uuid,uuid,uuid,integer,text,text,text,integer,integer),
  public.os_agent_run_cancel(uuid,uuid,uuid),
  public.os_agent_run_release(uuid,uuid,uuid,uuid),
  public.os_agent_run_resume(uuid,uuid,uuid,integer,text,text,integer),
  public.os_spent_today(uuid)
  to service_role;
-- os_review_validate, os_review_interrupt and os_chat_spent_this_month keep their
-- existing grants (create or replace with identical signatures preserves them).

comment on table public.os_agent_runs is
  'One agent run = one reviewed draft turn (same id). Cards are that turn''s os_review_proposals; nothing here saves Work or knowledge, approves, sends or publishes.';
comment on table public.os_agent_run_reads is
  'Immutable captures of work items a run read; the only record text a run card may cite (sourceId read:<id>).';
comment on table public.os_agent_run_rounds is
  'Append-only: every model round a run reserved, held at its projected cost; a hold counts as spent until the ledger has the round.';
comment on table public.os_agent_run_usage is
  'Append-only ledger: what each reserved model round of a run cost (its reported usage, or its hold when none arrived), counted in monthly and daily spend at its round''s reserved_at.';

-- APPLY_TO_PRODUCTION.sql bundle: begin; <this file>;
-- insert into supabase_migrations.schema_migrations (version, name, statements) values
--   ('20261017200000', 'agent_runs', array['-- applied as a bundle by the owner; statements in git: supabase/migrations/20261017200000_agent_runs.sql']);
-- commit;
-- Push only after `npx supabase migration list --linked` shows 20261017200000 remote.
