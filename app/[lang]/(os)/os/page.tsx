import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CofounderQueue } from "@/components/CofounderQueue";
import { CofounderActivity } from "@/components/CofounderActivity";
import { CompanyApp } from "@/components/os/CompanyApp";
import { CofounderPane } from "@/components/os/CofounderPane";
import { MemoryApp } from "@/components/os/MemoryApp";
import { RecordApp } from "@/components/os/RecordApp";
import { OsShell } from "@/components/os/OsShell";
import { OS_SHELL_COPY, OS_COFOUNDER_CHAT_COPY, OS_MEMORY_COPY, OS_RECORD_COPY } from "@/components/osCopy";
import type { OsApp } from "@/components/os/types";
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

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();

    const [{ data: company }, { count }, { data: desktop }] = await Promise.all([
      supabase.from("os_companies").select("name").limit(1).maybeSingle(),
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
    for (const fact of facts ?? []) {
      targets.push({ kind: "memory", id: fact.id, label: fact.fact, hint: fact.kind });
    }
  }

  const apps: OsApp[] = [
    {
      id: "cofounder",
      title: OS_COFOUNDER_CHAT_COPY[locale].title,
      glyph: "✦",
      node: <CofounderPane locale={locale} />,
      defaultRect: { x: 48, y: 40, w: 560, h: 520 },
      openByDefault: true,
    },
    {
      id: "needs-you",
      title: copy.apps.needsYou,
      glyph: "◆",
      node: <CofounderQueue locale={locale} userId={claims.sub} bare />,
      defaultRect: { x: 636, y: 40, w: 500, h: 420 },
      openByDefault: true,
    },
    {
      id: "running",
      title: copy.apps.running,
      glyph: "▶",
      node: <CofounderActivity locale={locale} bare />,
      defaultRect: { x: 636, y: 484, w: 500, h: 340 },
      openByDefault: false,
    },
    {
      id: "record",
      title: OS_RECORD_COPY[locale].title,
      glyph: "≡",
      node: <RecordApp locale={locale} seenAt={seenAt} />,
      defaultRect: { x: 120, y: 200, w: 560, h: 420 },
    },
    {
      id: "memory",
      title: OS_MEMORY_COPY[locale].title,
      glyph: "◈",
      node: <MemoryApp locale={locale} />,
      defaultRect: { x: 200, y: 260, w: 560, h: 400 },
    },
    {
      id: "company",
      title: copy.apps.company,
      glyph: "▣",
      node: <CompanyApp locale={locale} />,
      defaultRect: { x: 240, y: 300, w: 440, h: 320 },
    },
  ];

  return (
    <OsShell
      apps={apps}
      copy={{
        desktop: copy.desktop,
        empty: copy.empty,
        emptyHint: copy.emptyHint,
        waitingLabel: copy.waiting(waiting),
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
