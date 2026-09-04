import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { localizePath, type Locale } from "@/lib/i18n";
import styles from "@/components/os/OsShell.module.css";

/* The MaydaOS chrome, running for real.
 *
 * Same frame the lab uses — system bar, dock, window, status bar — but the
 * dock is made of links rather than tabs, so every app is its own address
 * that can be deep-linked, bookmarked and server-rendered. The window body
 * is whatever the page hands it.
 */

export const OS_APPS = ["desk", "record", "pilot", "account", "terminal"] as const;
export type OsApp = (typeof OS_APPS)[number];

type AppMeta = { label: string; hint: string; glyph: string };

export const OS_APP_META: Record<Locale, Record<OsApp, AppMeta>> = {
  en: {
    desk: { label: "Desk", hint: "Produce work from sources", glyph: "01" },
    record: { label: "Record", hint: "Everything that happened", glyph: "02" },
    pilot: { label: "Pilot", hint: "Your engagement and invoices", glyph: "03" },
    account: { label: "Account", hint: "Maps, briefs, preferences", glyph: "04" },
    terminal: { label: "Terminal", hint: "Navigate with commands", glyph: ">_" },
  },
  tr: {
    desk: { label: "Masa", hint: "Kaynaklardan iş üret", glyph: "01" },
    record: { label: "Kayıt", hint: "Olan biten her şey", glyph: "02" },
    pilot: { label: "Pilot", hint: "Çalışmanız ve faturalarınız", glyph: "03" },
    account: { label: "Hesap", hint: "Haritalar, brief'ler, tercihler", glyph: "04" },
    terminal: { label: "Terminal", hint: "Komutlarla gezinin", glyph: ">_" },
  },
  fr: {
    desk: { label: "Bureau", hint: "Produire a partir des sources", glyph: "01" },
    record: { label: "Registre", hint: "Tout ce qui s'est passe", glyph: "02" },
    pilot: { label: "Pilote", hint: "Votre mission et vos factures", glyph: "03" },
    account: { label: "Compte", hint: "Cartes, briefs, preferences", glyph: "04" },
    terminal: { label: "Terminal", hint: "Naviguer par commandes", glyph: ">_" },
  },
};

const STATUS: Record<Locale, { connected: string; mode: string; footer: string }> = {
  en: { connected: "Signed in", mode: "Beta", footer: "AI produces. You approve. Nothing leaves without you." },
  tr: { connected: "Giriş yapıldı", mode: "Beta", footer: "Üretimi yapay zekâ yapar. Onayı siz verirsiniz. Sizsiz hiçbir şey çıkmaz." },
  fr: { connected: "Connecte", mode: "Beta", footer: "L'IA produit. Vous approuvez. Rien ne sort sans vous." },
};

export function OsShell({
  locale,
  app,
  credits,
  children,
}: {
  locale: Locale;
  app: OsApp;
  /* Shown in the system bar, where a number like this belongs. */
  credits: { left: number; granted: number } | null;
  children: React.ReactNode;
}) {
  const meta = OS_APP_META[locale];
  const status = STATUS[locale];

  return (
    <section className={`${styles.frame} mayda-os-live`} aria-label="MaydaOS" data-mayda-os="live">
      <header className={styles.systemBar}>
        <div className={styles.brand}>
          <Wordmark className={styles.wordmark} />
          <span className={styles.productName}>MaydaOS</span>
          <span className={styles.version}>03.0</span>
        </div>
        <div className={styles.systemState}>
          <span className={styles.stateDot} aria-hidden="true" />
          <span>{status.connected}</span>
          {credits ? (
            <span className="mayda-os-meter" title={`${credits.left} of ${credits.granted}`}>
              <strong>{credits.left}</strong>
              <small>/{credits.granted}</small>
            </span>
          ) : null}
          <span className={styles.mode}>{status.mode}</span>
        </div>
      </header>

      <div className={styles.workspace}>
        <nav className={styles.dock} aria-label="MaydaOS">
          <span className={styles.dockLabel}>MaydaOS</span>
          {OS_APPS.map((item) => {
            const isActive = item === app;
            return (
              <Link
                key={item}
                href={localizePath(`/os/${item}`, locale)}
                className={isActive ? styles.dockItemActive : styles.dockItem}
                aria-current={isActive ? "page" : undefined}
                title={meta[item].hint}
              >
                <span className={styles.dockGlyph} aria-hidden="true">{meta[item].glyph}</span>
                <span>
                  <strong>{meta[item].label}</strong>
                  <small>{meta[item].hint}</small>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.desktop}>
          <div className={styles.fieldGrid} aria-hidden="true">
            <i className={styles.fieldInput} />
            <i className={styles.fieldBranchOne} />
            <i className={styles.fieldBranchTwo} />
            <i className={styles.fieldBranchThree} />
          </div>

          <section className={styles.window} tabIndex={-1}>
            <header className={styles.windowBar}>
              <span className={styles.windowMark} aria-hidden="true">×</span>
              <div>
                <strong>{meta[app].label}</strong>
                <small>{meta[app].hint}</small>
              </div>
              <span className={styles.windowPath}>/os/{app}</span>
            </header>
            <div className={styles.windowBody}>{children}</div>
          </section>
        </div>
      </div>

      <footer className={styles.statusBar}>
        <span>{status.footer}</span>
        {/* The site header steps aside inside an app, so the way back lives here. */}
        <Link href={localizePath("/", locale)} className={styles.statusRoute}>
          maydalabs.com <span aria-hidden>↗</span>
        </Link>
      </footer>
    </section>
  );
}
