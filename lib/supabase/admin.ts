import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Service-credential client. Bypasses RLS — use it only inside validated
 * server code for the narrow cases that need it: anonymous intake inserts,
 * claiming anonymous maps after sign-in, and the operator gate lookup.
 * Never import from client code ("server-only" enforces this at build time)
 * and never derive query filters from unvalidated input.
 */
export function createSupabaseAdminClient() {
  // Legacy `SUPABASE_SERVICE_ROLE_KEY` is what the Vercel integration injects.
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secretKey) {
    throw new Error("SUPABASE_SECRET_KEY is not configured");
  }

  return createClient<Database>(getSupabaseUrl()!, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
