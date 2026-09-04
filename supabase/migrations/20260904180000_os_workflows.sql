-- Workflows stop being code.
--
-- Until now MaydaOS knew how to do exactly one thing, written into the
-- source. A workflow is the unit MaydaLabs actually sells: a named piece of
-- work, its inputs, the instruction the system follows, who it is for, and
-- where the output is meant to go. Making it a row means a different
-- workflow can be installed for each client without shipping anything, which
-- is how a pilot becomes a product.
--
-- A workflow with no owner is a template everyone can run. One with an owner
-- belongs to that person, which is what "installed in your accounts" looks
-- like from the inside.

create table public.os_workflows (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9_]{3,60}$'),
  owner_user_id uuid references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  purpose text not null check (char_length(purpose) between 1 and 300),
  -- The instruction handed to the model. This is the workflow.
  brief text not null check (char_length(brief) between 1 and 4000),
  -- Kept for the record and for display; new shapes arrive as new workflows.
  shape text not null default 'note' check (shape in ('note', 'post', 'summary')),
  -- Where the output is meant to end up. Informational: MaydaOS never sends
  -- anything itself, and the person records where it actually went.
  destination text check (destination is null or char_length(destination) <= 200),
  max_sources smallint not null default 5 check (max_sources between 1 and 5),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index os_workflows_owner_idx on public.os_workflows (owner_user_id);

create trigger os_workflows_set_updated_at
  before update on public.os_workflows
  for each row execute function internal.set_updated_at();

alter table public.os_runs
  add column workflow_id uuid references public.os_workflows (id) on delete set null;

create index os_runs_workflow_idx on public.os_runs (workflow_id);

-- ------------------------------------------------------------------ RLS

alter table public.os_workflows enable row level security;

revoke all on table public.os_workflows from anon, authenticated;
grant select on table public.os_workflows to authenticated;

-- Everyone sees the templates; you also see the ones installed for you.
create policy "os_workflows_select_template_or_own"
  on public.os_workflows for select
  to authenticated
  using (
    (active and owner_user_id is null)
    or owner_user_id = (select auth.uid())
    or exists (select 1 from internal.operators o where o.user_id = (select auth.uid()))
  );

-- Installing a workflow is MaydaLabs' job, not the client's.
create policy "os_workflows_write_operator"
  on public.os_workflows for all
  to authenticated
  using (exists (select 1 from internal.operators o where o.user_id = (select auth.uid())))
  with check (exists (select 1 from internal.operators o where o.user_id = (select auth.uid())));

-- --------------------------------------------------------------- templates

insert into public.os_workflows (key, name, purpose, brief, shape, destination, max_sources) values
  (
    'short_note',
    'Short note',
    'Turn a few links into a short internal note somebody can act on.',
    'a short internal note, 120 to 180 words, plain sentences, no headings. Lead with the single most useful fact.',
    'note',
    'An internal note',
    5
  ),
  (
    'linkedin_post',
    'LinkedIn post',
    'Turn a few links into a post that stands on its own, with its sources attached.',
    'a LinkedIn post of 150 to 220 words. The first line must stand alone. Short paragraphs. Do not attribute sources inside the prose; the claims list carries them.',
    'post',
    'LinkedIn',
    5
  ),
  (
    'source_summary',
    'Summary of the sources',
    'Say what the sources say, without adding an opinion.',
    'a summary of what the sources say, 100 to 150 words, no opinion of your own, no recommendation.',
    'summary',
    'Wherever you need it',
    5
  );
