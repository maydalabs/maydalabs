import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Request-scoped Supabase client for Server Components, Server Actions, and
 * Route Handlers. Uses the publishable key: every read and write through it
 * is subject to RLS as the signed-in user (or as anon).
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
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
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;
  return data.claims;
}
