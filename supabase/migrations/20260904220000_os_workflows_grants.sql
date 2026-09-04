-- Operators could never install a workflow.
--
-- The row-level policy allowed operators to write, but the table grant only
-- allowed select, and Postgres checks privileges before policies: every save
-- failed. Row-level security narrows what a grant permits; it cannot widen
-- it, and this is the mistake that follows from forgetting that.
--
-- The policy still decides who: only operators. The grant decides what is
-- possible at all.

grant insert, update, delete on table public.os_workflows to authenticated;
