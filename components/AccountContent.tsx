import { SignOutButton } from "@/components/PortalPanels";
import { PORTAL_COPY } from "@/components/portalCopy";
import type { Locale } from "@/lib/i18n";

/* Who is signed in, and the way out. Everything else an account once
 * carried — saved maps, a briefs list, a preferences form, profile fields
 * nothing read — was cut on 11 September: a client comes here for work
 * waiting on them and for their engagement, and those sections sit above. */
export function AccountContent({ locale, email }: { locale: Locale; email: string | null }) {
  const copy = PORTAL_COPY[locale];
  return (
    <header className="mayda-portal-header">
      <p className="mayda-body">
        {copy.signedInAs} <strong>{email ?? "—"}</strong>
      </p>
      <SignOutButton locale={locale} label={copy.signOut} />
    </header>
  );
}
