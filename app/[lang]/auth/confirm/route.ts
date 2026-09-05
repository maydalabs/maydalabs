import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { claimAnonymousRecords } from "@/lib/mapClaimServer";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isLocale, localizePath, type Locale } from "@/lib/i18n";

/**
 * Confirmation endpoint for the sign-in email's fallback link
 * (`?token_hash=...&type=email`). The primary flow is the emailed code;
 * this route exists so the emailed link also works.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lang: string }> },
) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : "en";

  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;

  const failureUrl = new URL(
    localizePath("/auth/sign-in", locale) + "?error=confirm",
    request.nextUrl.origin,
  );

  if (!tokenHash || type !== "email" || !isSupabaseConfigured()) {
    return NextResponse.redirect(failureUrl);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  if (error || !data.user) {
    return NextResponse.redirect(failureUrl);
  }

  await claimAnonymousRecords(data.user.id, data.user.email ?? null);

  return NextResponse.redirect(
    new URL(localizePath("/portal", locale), request.nextUrl.origin),
  );
}
