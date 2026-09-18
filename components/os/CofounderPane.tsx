import { CofounderApp, type ChatMessage } from "@/components/os/CofounderApp";
import { OS_COFOUNDER_CHAT_COPY } from "@/components/osCopy";
import { recentMessages } from "@/lib/osCofounder";
import { currentCompany } from "@/lib/osCompany";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Locale } from "@/lib/i18n";

/* The transcript, read on the server through the caller's own client.
 *
 * The conversation belongs to the company rather than to whoever opened it,
 * so the other founder sees the same history — a co-founder only one person
 * can read is a private assistant wearing the word.
 */
export async function CofounderPane({ locale, configured }: { locale: Locale; configured: boolean }) {
  const copy = OS_COFOUNDER_CHAT_COPY[locale];
  if (!isSupabaseConfigured()) {
    return <CofounderApp initialMessages={[]} copy={copy} canTalk={false} why={copy.notConfigured} />;
  }

  const supabase = await createSupabaseServerClient();
  const company = await currentCompany(supabase);
  if (!company) return <CofounderApp initialMessages={[]} copy={copy} canTalk={false} why={copy.noCompany} />;

  const { data: thread } = await supabase
    .from("os_threads")
    .select("id")
    .eq("company_id", company.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // The latest sixty, read through the caller's own client.
  const messages: ChatMessage[] = thread ? await recentMessages(supabase, thread.id, 60) : [];

  /* The transcript is shown either way. Whether it can be added to is a
   * fact about the server, decided here rather than discovered by sending
   * something and reading a 503. */
  return (
    <CofounderApp
      initialMessages={messages}
      copy={copy}
      canTalk={configured}
      why={configured ? null : copy.notConfigured}
    />
  );
}
