-- The co-founder's name, voice and manners.
--
-- Decided 29 September: the person who owns a company names its co-founder,
-- chooses one of three voices, and may add one line about how it should
-- sound. Each member then says how they themselves want to be addressed.
--
-- Columns on the company rather than a table of their own, for the reason
-- os_model_settings is not: there is no secret here and no service role. A
-- company has exactly one co-founder; every page already reads the company
-- row once (lib/osCompany.ts), so the name reaches the window title, the
-- dock and the brief with no new read; and the authority to change it is the
-- one os_companies_owner_write and the column grants already express
-- (20260916140000, 20260919090000).
--
-- Every limit is a check. The note is the one free-text field a model reads
-- as a preference, so it is short, one line, trimmed, and cannot carry the
-- two characters that would let it forge the fence the prompt wraps it in.
-- Nothing here changes what the co-founder may do: the per-mode tool set,
-- the review guards and the gate on os_work_items do not read these
-- columns. No memory line and no record line on a change: a name is a label
-- the owner may change, and the record is about work. The rename trigger on
-- this table (20260919090000) compares name only, so a persona save writes
-- nothing into memory.

alter table public.os_companies
  add column cofounder_name text
    check (cofounder_name is null or (
      cofounder_name = btrim(cofounder_name)
      and char_length(cofounder_name) between 1 and 40
      and cofounder_name !~ '[[:cntrl:]<>]'
    )),
  add column cofounder_voice text not null default 'plain'
    check (cofounder_voice in ('plain', 'warm', 'blunt')),
  add column cofounder_note text
    check (cofounder_note is null or (
      cofounder_note = btrim(cofounder_note)
      and char_length(cofounder_note) between 1 and 200
      and cofounder_note !~ '[[:cntrl:]<>]'
    ));

comment on column public.os_companies.cofounder_name is
  'What the company calls its co-founder. Null means the plain word in the person''s language. A label, not a fact: it appears in the window title and the prompt, never in the record.';
comment on column public.os_companies.cofounder_voice is
  'plain, warm or blunt. lib/osCofounder.ts maps each to a wording instruction, versioned with PERSONA_INSTRUCTION_VERSION. Changes how the co-founder sounds in conversation, never what it may do and never the tone of a draft.';
comment on column public.os_companies.cofounder_note is
  'One line from the owner about wording. Read by the model as an untrusted preference inside a fence; cannot grant a capability or state a company fact. Facts go in what_we_do or memory.';

-- The owner may change these three; the budget stays ours. Column grants are
-- additive to (name, what_we_do); the owner policy already decides who.
grant update (cofounder_name, cofounder_voice, cofounder_note)
  on table public.os_companies to authenticated;

-- How each person wants to be addressed. On the membership row, because it
-- is a fact about this person at this company: "Boss" at one, "Dr. Mayda"
-- at another. Only the person may write their own row, and only this
-- column; role, company and user stay beyond a browser's reach because no
-- update grant names them, and Postgres checks the column grant before the
-- policy. Every member can read it, as they can read every membership row
-- of their company today (os_company_members_read_own): the co-founder says
-- it aloud in the shared conversation anyway.
alter table public.os_company_members
  add column address_as text
    check (address_as is null or (
      address_as = btrim(address_as)
      and char_length(address_as) between 1 and 40
      and address_as !~ '[[:cntrl:]<>]'
    ));

comment on column public.os_company_members.address_as is
  'How the co-founder addresses this person in conversation. Theirs alone to set. Never written into drafts.';

grant update (address_as) on table public.os_company_members to authenticated;

create policy "os_company_members_address_own" on public.os_company_members
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
