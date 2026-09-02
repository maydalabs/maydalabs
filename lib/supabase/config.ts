/**
 * Whether the public Supabase configuration is present. Until a project is
 * provisioned and its env vars are set on the host, the site must keep
 * serving every marketing page and fail closed (never 500) on the account
 * and intake surfaces.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
