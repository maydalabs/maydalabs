import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CofounderQueue } from "@/components/CofounderQueue";
import { CofounderActivity } from "@/components/CofounderActivity";
import { CompanyApp } from "@/components/os/CompanyApp";
import { CofounderPane } from "@/components/os/CofounderPane";
import { MemoryApp } from "@/components/os/MemoryApp";
import { RecordApp } from "@/components/os/RecordApp";
import { WorkApp } from "@/components/os/WorkApp";
import { Brief } from "@/components/os/Brief";
import { ItemDocument, type ItemEvent, type ItemRecord } from "@/components/os/ItemDocument";
import { OsShell } from "@/components/os/OsShell";
import {
  OS_SHELL_COPY,
  OS_COFOUNDER_CHAT_COPY,
  OS_MEMORY_COPY,
  OS_RECORD_COPY,
  OS_WORKAPP_COPY,
} from "@/components/osCopy";
import { documentKey, type OsApp, type OsDocument } from "@/components/os/types";
import type { CommandTarget } from "@/components/os/OsCommandBar";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";
import { currentCompany } from "@/lib/osCompany";
import { composeBrief, type Brief as BriefModel, type ChangeRow, type NeedRow, type WorkflowRow } from "@/lib/osBrief";
import { isCofounderConfigured } from "@/lib/osCofounderModel";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";

export const metadata: Metadata = {
  title: "MaydaOS",
  robots: { index: false, follow: false },
};

/* The desk.
 *
 * Every app is rendered here, on the server, with its own data access, and
 * handed to the shell as a node. The shell arranges and never fetches, which
 * is what keeps adding the next app — the co-founder conversation, the
 * record, files — from being a change to the shell at all.
 */
export default async function OsPage(props: LocalePageProps) {
  const locale = await getPageLocale(props.params);
  const copy = OS_SHELL_COPY[locale];

  const claims = await getVerifiedClaims();
  if (!claims?.sub) redirect(localizePath("/auth/sign-in", locale));

  let companyName: string | null = null;
  let waiting = 0;
  let storedLayout: unknown = [];
  let seenAt: string | null = null;
  let unread = 0;
  const targets: CommandTarget[] = [];
  const documents: OsDocument[] = [];
  // The same rows the documents are built from, kept for the Work app: one
  // query feeding two views, not two queries that could disagree.
  let workItems: ItemRecord[] = [];
  let needs: NeedRow[] = [];
  let lastChange: ChangeRow | null = null;
  let workflows: WorkflowRow[] = [];
  let finishedCount = 0;
  let hasCompany = false;

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();

    const [company, { count }, { data: desktop }] = await Promise.all([
      currentCompany(supabase),
      supabase.from("os_needs_you").select("id", { count: "exact", head: true }),
      supabase.from("os_desktops").select("layout, seen_at").eq("user_id", claims.sub).maybeSingle(),
    ]);
    hasCompany = company !== null;

    companyName = company?.name ?? null;
    waiting = count ?? 0;
    storedLayout = desktop?.layout ?? [];
    seenAt = desktop?.seen_at ?? null;

    /* What the command bar can find. Deliberately the things a person names
     * out loud — an open piece of work, something it knows — rather than
     * everything in the database. A search that returns four hundred rows is
     * a search nobody uses twice. */
    const [{ count: newCount }, { data: facts }, { data: latest }] = await Promise.all([
      seenAt
        ? supabase.from("os_recent_record").select("id", { count: "exact", head: true }).gt("at", seenAt)
        : Promise.resolve({ count: 0 } as { count: number | null }),
      supabase.from("os_company_memory").select("id, fact, kind").is("retired_at", null).limit(20),
      seenAt
        ? supabase
            .from("os_recent_record")
            .select("title, event, by_a_person")
            .gt("at", seenAt)
            .order("at", { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null as ChangeRow | null }),
    ]);

    unread = newCount ?? 0;
    lastChange = latest ?? null;

    /* Every open piece of work, rendered as a document up front and handed to
     * the shell, which shows whichever are opened. Thirty small documents
     * cost less than one round trip made the moment someone clicks — and it
     * keeps an app a server component with its own data access, which is the
     * contract everything else here rests on. */
    if (company?.id) {
      const COLUMNS =
        "id, title, lane, kind, status, required_action, notes, sources, artifacts, metadata, updated_at, due_on";
      const [{ data: open }, { data: finished }, { data: waitingRows }, { data: activity }] = await Promise.all([
        /* Open work comes through a view that carries how far off each due
         * date is, by the database's clock: the page never reads its own. */
        supabase
          .from("os_work_open")
          .select(`${COLUMNS}, due_in_days`)
          .eq("company_id", company.id)
          .order("updated_at", { ascending: false })
          .limit(30),
        /* Finished work stays openable for a fortnight — long enough to check
         * where something went, short enough that the desk is not an archive.
         * The fortnight is the view's clock, not this page's. */
        supabase
          .from("os_finished_lately")
          .select(COLUMNS)
          .eq("company_id", company.id)
          .order("updated_at", { ascending: false })
          .limit(15),
        /* For the brief: the three that have waited longest, by the
         * database's clock. */
        supabase
          .from("os_needs_you")
          .select("id, title, status, waiting_days")
          .eq("company_id", company.id)
          .order("waiting_days", { ascending: false })
          .limit(3),
        supabase
          .from("os_activity")
          .select("name, active, due_in_hours, paused_reason")
          .eq("company_id", company.id)
          .eq("active", true),
      ]);
      needs = waitingRows ?? [];
      workflows = activity ?? [];
      finishedCount = (finished ?? []).length;

      /* A view's columns are all nullable to the type generator, and a type
       * predicate cannot narrow jsonb to `unknown`. So each row is rebuilt
       * field by field: a real item has every one of these, and anything that
       * does not is simply not shown. */
      const rows: ItemRecord[] = [
        ...(open ?? []),
        ...(finished ?? []).map((r) => ({ ...r, due_in_days: null })),
      ].flatMap((r) =>
        r.id && r.title && r.lane && r.kind && r.status && r.updated_at
          ? [
              {
                id: r.id,
                title: r.title,
                lane: r.lane,
                kind: r.kind,
                status: r.status,
                required_action: r.required_action,
                notes: r.notes,
                sources: r.sources,
                artifacts: r.artifacts,
                metadata: r.metadata,
                updated_at: r.updated_at,
                due_on: r.due_on,
                due_in_days: r.due_in_days,
              },
            ]
          : [],
      );
      workItems = rows;
      const ids = rows.map((r) => r.id);
      const { data: history } = ids.length
        ? await supabase
            .from("os_work_item_events")
            .select("item_id, event, actor, at")
            .in("item_id", ids)
            .order("at", { ascending: true })
        : { data: [] as { item_id: string; event: string; actor: string | null; at: string }[] };

      const byItem = new Map<string, ItemEvent[]>();
      for (const e of history ?? []) {
        const list = byItem.get(e.item_id) ?? [];
        list.push({ event: e.event, actor: e.actor, at: e.at });
        byItem.set(e.item_id, list);
      }

      for (const item of rows) {
        // Every document is findable from ⌘K — including drafts, which need
        // nobody and so appear in no queue, and work finished this fortnight.
        targets.push({ kind: "item", id: item.id, label: item.title, hint: `${item.lane}/${item.kind}` });
        documents.push({
          key: documentKey(item.id),
          title: item.title,
          icon: "record",
          node: <ItemDocument locale={locale} item={item} events={byItem.get(item.id) ?? []} />,
        });
      }
    }
    for (const fact of facts ?? []) {
      targets.push({ kind: "memory", id: fact.id, label: fact.fact, hint: fact.kind });
    }
  }

  const brief: BriefModel = composeBrief({
    needs,
    needCount: waiting,
    due: workItems.map((item) => ({ id: item.id, title: item.title, status: item.status, due_in_days: item.due_in_days })),
    changes: seenAt ? unread : null,
    lastChange,
    workflows,
    finishedThisFortnight: finishedCount,
  });

  /* Without a model behind it the co-founder can say nothing, so it does not
   * greet a person with a window that cannot answer: the brief does, and the
   * queue. The moment a key exists this flips, and the desk opens on the
   * conversation instead. */
  const configured = isCofounderConfigured();

  /* Default windows keep to the right of the brief, which owns the left of
   * the desk. Shares of the surface, not pixels: see OsWindowState.placed. */
  const apps: OsApp[] = [
    {
      id: "cofounder",
      title: OS_COFOUNDER_CHAT_COPY[locale].title,
      icon: "cofounder",
      node: <CofounderPane locale={locale} configured={configured} />,
      defaultRect: { x: 0.44, y: 0.03, w: 0.535, h: 0.9 },
      openByDefault: configured,
      dormant: !configured,
    },
    {
      id: "needs-you",
      title: copy.apps.needsYou,
      icon: "needs-you",
      node: <CofounderQueue locale={locale} userId={claims.sub} bare />,
      defaultRect: { x: 0.44, y: 0.03, w: 0.535, h: 0.56 },
      openByDefault: !configured,
    },
    {
      id: "work",
      title: OS_WORKAPP_COPY[locale].title,
      icon: "work",
      node: <WorkApp locale={locale} items={workItems} />,
      defaultRect: { x: 0.3, y: 0.1, w: 0.62, h: 0.74 },
    },
    {
      id: "running",
      title: copy.apps.running,
      icon: "running",
      node: <CofounderActivity locale={locale} bare />,
      defaultRect: { x: 0.44, y: 0.62, w: 0.535, h: 0.31 },
      openByDefault: false,
    },
    {
      id: "record",
      title: OS_RECORD_COPY[locale].title,
      icon: "record",
      node: (
        <RecordApp
          locale={locale}
          seenAt={seenAt}
          openable={documents.map((d) => d.key.slice("item:".length))}
        />
      ),
      defaultRect: { x: 0.34, y: 0.18, w: 0.55, h: 0.6 },
    },
    {
      id: "memory",
      title: OS_MEMORY_COPY[locale].title,
      icon: "memory",
      node: <MemoryApp locale={locale} />,
      defaultRect: { x: 0.38, y: 0.22, w: 0.58, h: 0.58 },
    },
    {
      id: "company",
      title: copy.apps.company,
      icon: "company",
      node: <CompanyApp locale={locale} />,
      defaultRect: { x: 0.42, y: 0.28, w: 0.42, h: 0.46 },
    },
  ];

  return (
    <OsShell
      apps={apps}
      documents={documents}
      brief={<Brief locale={locale} brief={brief} hasCompany={hasCompany} />}
      locale={locale}
      copy={{
        desktop: copy.desktop,
        today: copy.today,
        waitingLabel: copy.waiting(waiting),
        waitingShort: String(waiting),
        close: copy.close,
        minimize: copy.minimize,
        resize: copy.resize,
        noCompany: copy.noCompany,
        leave: copy.leave,
        newSince: copy.newSince,
        markSeen: copy.markSeen,
      }}
      commandTargets={[
        ...apps.map((app) => ({
          kind: "app" as const,
          id: app.id,
          label: app.title,
          hint: copy.commandOpen,
        })),
        ...targets,
      ]}
      commandCopy={{
        placeholder: copy.commandPlaceholder,
        ask: copy.commandAsk,
        tell: copy.commandTell,
        add: copy.commandAdd,
        lane: copy.commandLane,
        lanes: OS_WORKAPP_COPY[locale].lanes,
        open: copy.commandOpen,
        nothing: copy.commandNothing,
        hint: copy.commandHint,
      }}
      unreadCount={unread}
      storedLayout={storedLayout}
      companyName={companyName}
      waitingCount={waiting}
      email={typeof claims.email === "string" ? claims.email : null}
      accountHref={localizePath("/portal", locale)}
    />
  );
}
