import { CofounderApp } from "@/components/os/CofounderApp";
import { OS_COFOUNDER_CHAT_COPY } from "@/components/osCopy";
import { currentCompany } from "@/lib/osCompany";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { loadReviewSnapshot } from "@/lib/osReviewStore";
import { fill, type Locale } from "@/lib/i18n";

export async function CofounderPane({ locale, configured, cofounderName = null }: { locale: Locale; configured: boolean; cofounderName?: string | null }) {
  const base = OS_COFOUNDER_CHAT_COPY[locale];
  /* The name, where the window speaks of itself: the placeholder, the empty
   * state and the speaker label. Refusals, receipts and notices keep the
   * plain word; they are about what happened, not who. */
  const copy = cofounderName
    ? { ...base, placeholder: fill(base.placeholderNamed, { name: cofounderName }), empty: fill(base.emptyNamed, { name: cofounderName }), who: cofounderName }
    : base;
  if (!isSupabaseConfigured()) return <CofounderApp initialSnapshot={null} locale={locale} copy={copy} canTalk={false} why={copy.notConfigured} />;
  try {
    const db = await createSupabaseServerClient();
    const claims = await getVerifiedClaims();
    const company = await currentCompany(db);
    if (!company || !claims?.sub) return <CofounderApp initialSnapshot={null} locale={locale} copy={copy} canTalk={false} why={copy.noCompany} />;
    const snapshot = await loadReviewSnapshot(db, company.id, claims.sub);
    return <CofounderApp initialSnapshot={snapshot} locale={locale} copy={copy} canTalk={configured} why={configured ? null : copy.notConfigured} />;
  } catch {
    // A missing migration/read failure is NOT an empty company/conversation.
    return <CofounderApp initialSnapshot={null} locale={locale} copy={copy} canTalk={false}
      why={locale === "tr" ? "Kayıtlar okunamadı. Yenileyip tekrar kontrol edin." : locale === "fr" ? "Les données sont indisponibles. Actualisez pour vérifier." : "Stored records are unavailable. Refresh to check again."} />;
  }
}
