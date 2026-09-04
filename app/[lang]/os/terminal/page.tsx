import type { Metadata } from "next";
import { OsShell } from "@/components/os/OsShell";
import { OsTerminal } from "@/components/os/OsTerminal";
import { requireOsSession } from "@/lib/osSession";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";

export const metadata: Metadata = {
  title: "MaydaOS · Terminal",
  robots: { index: false, follow: false },
};

export default async function OsTerminalPage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  const { claims, supabase, credits } = await requireOsSession(locale, "terminal");

  const { count } = await supabase.from("os_runs").select("id", { count: "exact", head: true });

  return (
    <OsShell locale={locale} app="terminal" credits={credits}>
      <OsTerminal
        locale={locale}
        email={typeof claims.email === "string" ? claims.email : "—"}
        credits={credits}
        runs={count ?? 0}
      />
    </OsShell>
  );
}
