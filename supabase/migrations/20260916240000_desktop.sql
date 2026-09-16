-- Where your desk stays where you left it.
--
-- A window you moved is a small thing to remember and a loud thing to
-- forget: an environment that resets every visit is a web page wearing a
-- desktop's clothes. This lives in the database rather than the browser so
-- it follows a person between machines, and into the desktop app later.

create table public.os_desktops (
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- [{ "app": "needs-you", "x": 40, "y": 60, "w": 520, "h": 420, "z": 1,
  --    "open": true, "minimized": false }]
  layout jsonb not null default '[]'::jsonb
    check (jsonb_typeof(layout) = 'array' and jsonb_array_length(layout) <= 40),
  updated_at timestamptz not null default now()
);

alter table public.os_desktops enable row level security;

revoke all on table public.os_desktops from anon, authenticated;
grant select, insert, update on table public.os_desktops to authenticated;

-- Your desk, and nobody else's. There is no shared-desktop concept and the
-- absence is deliberate: two people dragging the same window is a feature
-- nobody asked for.
create policy "os_desktops_own" on public.os_desktops
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create trigger os_desktops_set_updated_at
  before update on public.os_desktops
  for each row execute function internal.set_updated_at();

comment on table public.os_desktops is
  'One row per person: where their windows are. Deleting it resets the desk rather than losing anything.';
