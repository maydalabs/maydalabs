import { CofounderApp, type ChatMessage } from "@/components/os/CofounderApp";
import { OS_COFOUNDER_CHAT_COPY } from "@/components/osCopy";
import { recentMessages } from "@/lib/osCofounder";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Locale } from "@/lib/i18n";

/* The transcript, read on the server through the caller's own client.
 *
 * The conversation belongs to the company rather than to whoever opened it,
 * so the other founder sees the same history — a co-founder only one person
 * can read is a private assistant wearing the word.
 */
export async function CofounderPane({ locale }: { locale: Locale }) {
  const copy = OS_COFOUNDER_CHAT_COPY[locale];
  if (!isSupabaseConfigured()) {
    return <CofounderApp initialMessages={[]} copy={copy} canTalk={false} />;
  }

  const supabase = await createSupabaseServerClient();
  const { data: company } = await supabase.from("os_companies").select("id").limit(1).maybeSingle();
  if (!company) return <CofounderApp initialMessages={[]} copy={copy} canTalk={false} />;

  const { data: thread } = await supabase
    .from("os_threads")
    .select("id")
    .eq("company_id", company.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // The latest sixty, read through the caller's own client.
  const messages: ChatMessage[] = thread ? await recentMessages(supabase, thread.id, 60) : [];

  return <CofounderApp initialMessages={messages} copy={copy} canTalk />;
}
