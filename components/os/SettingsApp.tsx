import { signOutAction } from "@/app/actions/auth";
import { AddressEditor } from "@/components/os/AddressEditor";
import { SettingsPanel } from "@/components/os/SettingsPanel";
import { OS_SETTINGS_COPY } from "@/components/osCopy";
import type { OsPrefs } from "@/lib/osDesktop";
import { LOCALES, localizePath, type Locale } from "@/lib/i18n";

/* Settings.
 *
 * What is a person's about the desk, as opposed to the company's: how it
 * looks, which language it speaks, where the windows go, whether it lives in
 * the Dock, and how to leave. Small on purpose. An operating system's settings
 * are where its ambitions go to sprawl, and this one has four sections.
 */
export function SettingsApp({ locale, prefs, email, companyId = null, address = null, cofounderName = null }: {
  locale: Locale; prefs: OsPrefs; email: string | null;
  /* The desk's company, and how its co-founder addresses this person there. */
  companyId?: string | null; address?: string | null; cofounderName?: string | null;
}) {
  const copy = OS_SETTINGS_COPY[locale];

  return (
    <div className="os-settings">
      <SettingsPanel prefs={prefs} copy={copy} />

      <section className="os-settings-section">
        <h2 className="os-doc-label">{copy.language}</h2>
        {/* Plain links: a language is a different address for the same desk,
            and the address bar should say so. */}
        <div className="os-settings-languages">
          {LOCALES.map((other) => (
            <a
              key={other}
              href={localizePath("/os", other)}
              className="os-settings-language"
              aria-current={other === locale ? "true" : undefined}
              hrefLang={other}
            >
              {copy.languages[other] ?? other}
            </a>
          ))}
        </div>
      </section>

      {/* Yours, not the company's: what it calls you when you talk. */}
      <section className="os-settings-section">
        <h2 className="os-doc-label">{cofounderName ? copy.addressNamed.replace("{name}", cofounderName) : copy.address}</h2>
        <p className="os-doc-quiet">{copy.addressHint}</p>
        {companyId ? (
          <AddressEditor
            address={address}
            copy={{ placeholder: copy.addressPlaceholder, save: copy.addressSave, saved: copy.addressSaved, failed: copy.addressFailed, reasons: copy.addressReasons }}
          />
        ) : (
          <p className="os-doc-quiet">{copy.addressNoCompany}</p>
        )}
      </section>

      <section className="os-settings-section">
        <h2 className="os-doc-label">{copy.account}</h2>
        {email ? <p className="os-doc-quiet">{copy.signedInAs.replace("{email}", email)}</p> : null}
        <form action={signOutAction}>
          <input type="hidden" name="locale" value={locale} />
          <button type="submit" className="mayda-button mayda-button-outline">{copy.signOut}</button>
        </form>
      </section>
    </div>
  );
}
