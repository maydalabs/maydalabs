-- The first input: things that arrive from outside and become work.
--
-- Until now every item on a desk was made by a person, by the co-founder,
-- or by the worker — and the last two do not run without a model. "It tells
-- you what needs you" was only ever true of what you had typed yourself.
--
-- A signal is one thing that arrived: where from, what kind, an id from the
-- place it came from so it can never be filed twice, and the work item it
-- became. A connection says which company receives which source. The first
-- source is the site's own lead form: a new lead becomes a piece of sales
-- work, due tomorrow, in the queue of the one company connected to it. No
-- model is involved; a rule is. Later sources — a mailbox, Stripe, a repo —
-- are further rows in os_connections and further triggers writing the same
-- two tables.

-- Which company receives which source. Operator-only to write: the site's
-- leads belong to exactly one company, and a member must not be able to
-- route them to theirs. Members may see their own company's connections.
create table public.os_connections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.os_companies (id) on delete cascade,
  kind text not null check (kind in ('maydalabs_site')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, kind)
);

alter table public.os_connections enable row level security;

revoke all on table public.os_connections from anon, authenticated;
grant select, insert, update, delete on table public.os_connections to authenticated;

create policy "os_connections_member_select" on public.os_connections
  for select to authenticated
  using (public.os_is_member(company_id));

create policy "os_connections_operator_write" on public.os_connections
  for all to authenticated
  using (exists (select 1 from internal.operators o where o.user_id = (select auth.uid())))
  with check (exists (select 1 from internal.operators o where o.user_id = (select auth.uid())));

-- What arrived. Written only by the database, on the way in: nobody holds
-- an insert grant, so a signal cannot be forged from a browser, and the
-- unique key means the same lead cannot become two pieces of work.
create table public.os_signals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.os_companies (id) on delete cascade,
  source text not null check (char_length(source) between 1 and 40),
  kind text not null check (char_length(kind) between 1 and 40),
  external_id text not null check (char_length(external_id) between 1 and 200),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  item_id uuid references public.os_work_items (id) on delete set null,
  received_at timestamptz not null default now(),
  unique (company_id, source, kind, external_id)
);

alter table public.os_signals enable row level security;

revoke all on table public.os_signals from anon, authenticated;
grant select on table public.os_signals to authenticated;

create policy "os_signals_member_select" on public.os_signals
  for select to authenticated
  using (public.os_is_member(company_id));

create index os_signals_company_received_idx on public.os_signals (company_id, received_at desc);

-- A lead arrives.
--
-- Definer, because the lead form writes with the service credential and the
-- work it becomes belongs to a company the form knows nothing about. The
-- item is born pending — nobody has decided anything — with a due date of
-- tomorrow, because a lead is work whose value halves with every day it
-- waits, and the brief lists dated work whose day has come. The record says
-- the system filed it; a person's own actions are recorded in the same words.

create or replace function internal.os_signal_from_lead()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  connection record;
  who text;
  heading text;
  body text;
  new_item uuid;
begin
  who := coalesce(nullif(trim(new.name), ''), new.email);
  heading := 'Reply to ' || who
    || case when nullif(trim(coalesce(new.company, '')), '') is not null then ' — ' || trim(new.company) else '' end;

  -- The form stores codes; a person reads words. The words are the form's
  -- own English labels, so what arrives reads as the visitor saw it.
  body := 'From: ' || who || ' <' || new.email || '>'
    || case when nullif(trim(coalesce(new.company, '')), '') is not null then E'\nCompany: ' || trim(new.company) else '' end
    || case new.company_stage
         when 'idea' then E'\nStage: Idea' when 'launched' then E'\nStage: Launched'
         when 'growing' then E'\nStage: Growing' when 'established' then E'\nStage: Established'
         else coalesce(E'\nStage: ' || nullif(trim(new.company_stage), ''), '') end
    || case new.primary_constraint
         when 'product_not_built' then E'\nConstraint: Product does not exist yet' when 'product_stuck' then E'\nConstraint: Product is stuck'
         when 'growth_flat' then E'\nConstraint: Growth is flat' when 'operations_drag' then E'\nConstraint: Too much manual work'
         when 'reliability_risk' then E'\nConstraint: Reliability / security' when 'unclear' then E'\nConstraint: Unclear'
         else coalesce(E'\nConstraint: ' || nullif(trim(new.primary_constraint), ''), '') end
    || case when nullif(trim(coalesce(new.desired_outcome, '')), '') is not null then E'\nWants: ' || trim(new.desired_outcome) else '' end
    || case new.budget_range
         when 'undisclosed' then E'\nBudget: Prefer not to say' when 'under_10k' then E'\nBudget: Under $10k'
         when '10k_30k' then E'\nBudget: $10k–30k' when '30k_plus' then E'\nBudget: $30k+'
         else coalesce(E'\nBudget: ' || nullif(trim(new.budget_range), ''), '') end
    || case new.timeline
         when 'now' then E'\nTimeline: Now' when 'quarter' then E'\nTimeline: This quarter' when 'exploring' then E'\nTimeline: Still exploring'
         else coalesce(E'\nTimeline: ' || nullif(trim(new.timeline), ''), '') end
    || case when nullif(trim(coalesce(new.message, '')), '') is not null then E'\n\n' || trim(new.message) else '' end
    || E'\n\nArrived through ' || new.source || ' (' || new.locale || ').'
    || case when new.consent_contact then ' They agreed to be contacted.' else ' They did not agree to be contacted.' end;

  for connection in
    select company_id from public.os_connections where kind = 'maydalabs_site' and active
  loop
    -- The same lead never becomes two pieces of work for one company.
    if exists (
      select 1 from public.os_signals s
       where s.company_id = connection.company_id
         and s.source = 'maydalabs_site' and s.kind = 'lead' and s.external_id = new.id::text
    ) then
      continue;
    end if;

    insert into public.os_work_items (company_id, lane, kind, title, status, notes, due_on, metadata)
    values (
      connection.company_id,
      'sales',
      'reply',
      left(heading, 200),
      'pending',
      left(body, 8000),
      current_date + 1,
      jsonb_build_object('by', 'signal', 'source', 'maydalabs_site', 'lead_id', new.id)
    )
    returning id into new_item;

    insert into public.os_signals (company_id, source, kind, external_id, payload, item_id)
    values (
      connection.company_id,
      'maydalabs_site',
      'lead',
      new.id::text,
      jsonb_build_object('name', new.name, 'email', new.email, 'company', new.company, 'locale', new.locale, 'source', new.source),
      new_item
    );

    insert into public.os_work_item_events (item_id, actor, event, detail)
    values (new_item, null, 'arrived', jsonb_build_object('source', 'maydalabs_site', 'kind', 'lead'));
  end loop;

  return null;
end;
$$;

revoke all on function internal.os_signal_from_lead() from public, anon, authenticated;

drop trigger if exists lead_intakes_signal on public.lead_intakes;

create trigger lead_intakes_signal
  after insert on public.lead_intakes
  for each row execute function internal.os_signal_from_lead();

comment on function internal.os_signal_from_lead() is
  'A new lead becomes a piece of sales work, due tomorrow, for every company connected to the site. Once per lead per company.';

-- Connecting is an operator's act, through a function that says so, rather
-- than a row a form composes: it checks the operator itself, so the same
-- refusal comes back whichever door it comes through.
create or replace function public.os_connect_site_leads(p_company_id uuid, p_active boolean default true)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.os_connections (company_id, kind, active)
  values (p_company_id, 'maydalabs_site', p_active)
  on conflict (company_id, kind) do update set active = excluded.active;
end;
$$;

revoke all on function public.os_connect_site_leads(uuid, boolean) from public, anon;
grant execute on function public.os_connect_site_leads(uuid, boolean) to authenticated;
