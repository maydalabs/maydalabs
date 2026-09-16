import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CofounderQueue } from "@/components/CofounderQueue";
import { CofounderActivity } from "@/components/CofounderActivity";
import { CompanyApp } from "@/components/os/CompanyApp";
import { CofounderPane } from "@/components/os/CofounderPane";
import { MemoryApp } from "@/components/os/MemoryApp";
import { RecordApp } from "@/components/os/RecordApp";
import { ItemDocument, type ItemEvent, type ItemRecord } from "@/components/os/ItemDocument";
import { OsShell } from "@/components/os/OsShell";
import { OS_SHELL_COPY, OS_COFOUNDER_CHAT_COPY, OS_MEMORY_COPY, OS_RECORD_COPY } from "@/components/osCopy";
import { documentKey, type OsApp, type OsDocument } from "@/components/os/types";
import type { CommandTarget } from "@/components/os/OsCommandBar";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";
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

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();

    const [{ data: company }, { count }, { data: desktop }] = await Promise.all([
      supabase.from("os_companies").select("id, name").limit(1).maybeSingle(),
      supabase.from("os_needs_you").select("id", { count: "exact", head: true }),
      supabase.from("os_desktops").select("layout, seen_at").eq("user_id", claims.sub).maybeSingle(),
    ]);

    companyName = company?.name ?? null;
    waiting = count ?? 0;
    storedLayout = desktop?.layout ?? [];
    seenAt = desktop?.seen_at ?? null;

    /* What the command bar can find. Deliberately the things a person names
     * out loud — an open piece of work, something it knows — rather than
     * everything in the database. A search that returns four hundred rows is
     * a search nobody uses twice. */
    const [{ count: newCount }, { data: items }, { data: facts }] = await Promise.all([
      seenAt
        ? supabase.from("os_recent_record").select("id", { count: "exact", head: true }).gt("at", seenAt)
        : Promise.resolve({ count: 0 } as { count: number | null }),
      supabase.from("os_needs_you").select("id, title, lane, kind").limit(20),
      supabase.from("os_company_memory").select("id, fact, kind").is("retired_at", null).limit(20),
    ]);

    unread = newCount ?? 0;

    for (const item of items ?? []) {
      if (item.id && item.title) {
        targets.push({ kind: "item", id: item.id, label: item.title, hint: `${item.lane}/${item.kind}` });
      }
    }

    /* Every open piece of work, rendered as a document up front and handed to
     * the shell, which shows whichever are opened. Thirty small documents
     * cost less than one round trip made the moment someone clicks — and it
     * keeps an app a server component with its own data access, which is the
     * contract everything else here rests on. */
    if (company?.id) {
      const { data: rows } = await supabase
        .from("os_work_items")
        .select("id, title, lane, kind, status, required_action, notes, sources, metadata, updated_at")
        .eq("company_id", company.id)
        .not("status", "in", "(completed,canceled)")
        .order("updated_at", { ascending: false })
        .limit(30);

      const ids = (rows ?? []).map((r) => r.id);
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

      for (const row of rows ?? []) {
        const item: ItemRecord = row;
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

  const apps: OsApp[] = [
    {
      id: "cofounder",
      title: OS_COFOUNDER_CHAT_COPY[locale].title,
      icon: "cofounder",
      node: <CofounderPane locale={locale} />,
      defaultRect: { x: 0.025, y: 0.03, w: 0.45, h: 0.9 },
      openByDefault: true,
    },
    {
      id: "needs-you",
      title: copy.apps.needsYou,
      icon: "needs-you",
      node: <CofounderQueue locale={locale} userId={claims.sub} bare />,
      defaultRect: { x: 0.5, y: 0.03, w: 0.475, h: 0.56 },
      openByDefault: true,
    },
    {
      id: "running",
      title: copy.apps.running,
      icon: "running",
      node: <CofounderActivity locale={locale} bare />,
      defaultRect: { x: 0.5, y: 0.62, w: 0.475, h: 0.31 },
      openByDefault: false,
    },
    {
      id: "record",
      title: OS_RECORD_COPY[locale].title,
      icon: "record",
      node: <RecordApp locale={locale} seenAt={seenAt} />,
      defaultRect: { x: 0.14, y: 0.18, w: 0.55, h: 0.6 },
    },
    {
      id: "memory",
      title: OS_MEMORY_COPY[locale].title,
      icon: "memory",
      node: <MemoryApp locale={locale} />,
      defaultRect: { x: 0.18, y: 0.22, w: 0.58, h: 0.58 },
    },
    {
      id: "company",
      title: copy.apps.company,
      icon: "company",
      node: <CompanyApp locale={locale} />,
      defaultRect: { x: 0.22, y: 0.28, w: 0.42, h: 0.46 },
    },
  ];

  return (
    <OsShell
      apps={apps}
      documents={documents}
      copy={{
        desktop: copy.desktop,
        empty: copy.empty,
        emptyHint: copy.emptyHint,
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
