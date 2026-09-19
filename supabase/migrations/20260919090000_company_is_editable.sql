-- A company can be corrected, and only in the ways a person should correct it.
--
-- Two things, found together on 19 September. A person starting a company
-- types its name and what they do, and nothing anywhere let them change
-- either afterwards — a typo in the first sentence the co-founder reads was
-- permanent. And the update grant was table-level, so an owner fixing that
-- typo could, through the API, also raise `monthly_chat_usd`: their own
-- conversation budget, which is the one number on this table that is ours to
-- set rather than theirs. The same mistake os_desktops made with seen_at.
--
-- Column grants are the fix, as they were there. The owner policy already
-- decides who; this decides what.

revoke update on table public.os_companies from authenticated;
grant update (name, what_we_do) on table public.os_companies to authenticated;

comment on column public.os_companies.monthly_chat_usd is
  'What this company may spend on conversation in a month. Ours to set: no browser holds an update grant on it.';

-- The correction, written down like any other.
--
-- Definer, because os_company_events does not exist and the record a company
-- has is its work items' — so this leaves a trace where a person will look
-- for it, which is the memory the co-founder already reads. `source` stays
-- 'person' because a person did it; the guard on that table allows it.

create or replace function internal.os_company_renamed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.name is distinct from old.name then
    insert into public.os_company_memory (company_id, fact, kind, source)
    values (
      new.id,
      'The company was renamed from "' || old.name || '" to "' || new.name || '".',
      'fact',
      'person'
    );
  end if;
  return null;
end;
$$;

revoke all on function internal.os_company_renamed() from public, anon, authenticated;

drop trigger if exists os_companies_renamed on public.os_companies;

create trigger os_companies_renamed
  after update on public.os_companies
  for each row execute function internal.os_company_renamed();

comment on function internal.os_company_renamed() is
  'A rename is written into what the co-founder knows, so it does not go on calling the company by a name nobody uses.';
