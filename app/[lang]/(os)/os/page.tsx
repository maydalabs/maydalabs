import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CofounderQueue } from "@/components/CofounderQueue";
import { CofounderActivity } from "@/components/CofounderActivity";
import { CompanyApp } from "@/components/os/CompanyApp";
import { CofounderPane } from "@/components/os/CofounderPane";
import { MemoryApp } from "@/components/os/MemoryApp";
import { OsShell } from "@/components/os/OsShell";
import { OS_SHELL_COPY, OS_COFOUNDER_CHAT_COPY, OS_MEMORY_COPY } from "@/components/osCopy";
import type { OsApp } from "@/components/os/types";
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

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();

    const [{ data: company }, { count }, { data: desktop }] = await Promise.all([
      supabase.from("os_companies").select("name").limit(1).maybeSingle(),
      supabase.from("os_needs_you").select("id", { count: "exact", head: true }),
      supabase.from("os_desktops").select("layout").eq("user_id", claims.sub).maybeSingle(),
    ]);

    companyName = company?.name ?? null;
    waiting = count ?? 0;
    storedLayout = desktop?.layout ?? [];
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
      }}
      storedLayout={storedLayout}
      companyName={companyName}
      waitingCount={waiting}
      email={typeof claims.email === "string" ? claims.email : null}
      accountHref={localizePath("/portal", locale)}
    />
  );
}
