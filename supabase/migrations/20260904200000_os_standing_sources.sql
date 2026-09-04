-- Inputs stop being something a person pastes.
--
-- The first honest step towards a workflow wired into real work: it can
-- carry its own sources. A page is read every run; a feed is expanded into
-- the newest items published inside the window, so "every week, read these
-- five feeds and draft the note" needs no input at all.
--
-- Public feeds and pages first, deliberately: no credentials, no OAuth, no
-- integration to approve. The same fetcher and the same private-address
-- guard apply, because the URLs are still ours to fetch.

alter table public.os_workflows
  add column standing_sources jsonb not null default '[]'::jsonb
    check (jsonb_typeof(standing_sources) = 'array' and jsonb_array_length(standing_sources) <= 10),
  -- How far back a feed is allowed to reach when it is expanded.
  add column window_days smallint not null default 7 check (window_days between 1 and 90);

comment on column public.os_workflows.standing_sources is
  '[{ "url": "https://...", "kind": "page" | "feed" }] - read on every run, before anything the person adds.';
