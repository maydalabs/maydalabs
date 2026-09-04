-- Closing the loop.
--
-- A run that is approved and then forgotten proves nothing. Abidin's rule is
-- that an action is only finished when the place it landed is recorded, and
-- MaydaOS inherits it: an approved draft carries the public URL where it
-- ended up, written by the person who put it there.
--
-- MaydaLabs never publishes on anyone's behalf, so this column is a record of
-- something a human did, not evidence that the system acted.

alter table public.os_runs
  add column published_url text
    check (published_url is null or (published_url ~ '^https://' and char_length(published_url) <= 500)),
  add column published_at timestamptz;

comment on column public.os_runs.published_url is
  'Where the approved draft ended up, recorded by the person who put it there. MaydaOS never publishes anything itself.';

-- The same column-level grant that limits a person to their own decision now
-- also lets them close the loop, and still nothing else.
grant update (published_url, published_at) on table public.os_runs to authenticated;
