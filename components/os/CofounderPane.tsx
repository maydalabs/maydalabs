import { CofounderApp } from "@/components/os/CofounderApp";
import { OS_COFOUNDER_CHAT_COPY } from "@/components/osCopy";
import { currentCompany } from "@/lib/osCompany";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { loadReviewSnapshot } from "@/lib/osReviewStore";
import type { Locale } from "@/lib/i18n";

export async function CofounderPane({ locale, configured }: { locale: Locale; configured: boolean }) {
  const copy = OS_COFOUNDER_CHAT_COPY[locale];
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
