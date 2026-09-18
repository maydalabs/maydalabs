-- Settings: a person's own preferences for their desk.
--
-- The same table as the layout, for the same reason the layout is there: a
-- preference is a property of a person's desk, not of the company, and it
-- should follow them from one machine to the next. One jsonb column, because
-- the set of preferences will grow and each one is small; the application
-- rebuilds whatever arrives before storing it (lib/osDesktop.ts), the way it
-- does for the layout.

alter table public.os_desktops
  add column if not exists prefs jsonb not null default '{}'::jsonb
    check (jsonb_typeof(prefs) = 'object');

comment on column public.os_desktops.prefs is
  'Wallpaper, accent and the like: the person''s own, rebuilt by the application before it is stored.';

-- The update grant is per column, so seen_at stays unwritable from a browser;
-- prefs joins the two columns a person may write.
grant update (prefs) on table public.os_desktops to authenticated;
