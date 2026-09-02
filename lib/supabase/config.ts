/**
 * Whether the public Supabase configuration is present. Until a project is
 * provisioned and its env vars are set on the host, the site must keep
 * serving every marketing page and fail closed (never 500) on the account
 * and intake surfaces.
 */
export function getSupabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

/** Publishable key, with the legacy anon-key name as a fallback (the Vercel
 *  Marketplace integration still injects `NEXT_PUBLIC_SUPABASE_ANON_KEY`). */
export function getSupabasePublishableKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey());
}
