import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Request-scoped Supabase client for Server Components, Server Actions, and
 * Route Handlers. Uses the publishable key: every read and write through it
 * is subject to RLS as the signed-in user (or as anon). Throws a clear error
 * when the project is not configured; callers that can degrade should check
 * isSupabaseConfigured() first.
 */
export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured for this environment");
  }
  const cookieStore = await cookies();

  return createServerClient<Database>(getSupabaseUrl()!, getSupabasePublishableKey()!, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component render — the proxy session
            // refresh covers cookie writes in that case.
          }
        },
      },
    },
  );
}

/**
 * Verified identity for protecting pages and data. Returns null when there
 * is no valid session. Never trust getSession() server-side.
 */
export async function getVerifiedClaims() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;
  return data.claims;
}
