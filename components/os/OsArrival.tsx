"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { MaydaMark } from "@/components/MaydaMark";
import { LOCALES, LOCALE_LABELS, type Locale, localizePath } from "@/lib/i18n";
import { OS_COPY } from "@/components/os/osCopy";

export type ArrivalPhase = "checking" | "visible" | "leaving" | "hidden";

const LOCALE_HREFS: Record<Locale, string> = {
  en: "/en",
  tr: "/tr",
  fr: "/fr",
};

export function OsArrival({
  locale,
  phase,
  onEnter,
  onInspectWork,
  onRoute,
  onProofSwitch,
}: {
  locale: Locale;
  phase: ArrivalPhase;
  onEnter: () => void;
  onInspectWork: () => void;
  onRoute: (intent: string) => void;
  onProofSwitch: (transmission: string) => void;
}) {
  const copy = OS_COPY[locale];
  const [activeProof, setActiveProof] = useState(0);

  if (phase === "hidden") return null;

  const proof = copy.workWindow.live[activeProof];

  return (
    <section
      className={`os-arrival is-${phase}`}
      aria-label={copy.arrival.label}
      aria-hidden={phase === "checking" || phase === "leaving" ? "true" : undefined}
    >
      <div className="os-arrival-shell">
        <header className="os-arrival-header">
          <span className="os-arrival-brand">
            <MaydaMark className="h-5 w-5 text-white" />
            <strong>MaydaLabs</strong>
          </span>
          <span className="os-arrival-status"><i aria-hidden="true" />{copy.arrival.ready}</span>
          <nav aria-label={copy.menubarHelp.language}>
            {LOCALES.map((nextLocale) => (
              <Link
                key={nextLocale}
                href={LOCALE_HREFS[nextLocale]}
                hrefLang={nextLocale}
                lang={nextLocale}
                aria-label={LOCALE_LABELS[nextLocale]}
                aria-current={locale === nextLocale ? "true" : undefined}
                className={locale === nextLocale ? "is-active" : ""}
              >
                {nextLocale.toUpperCase()}
              </Link>
            ))}
          </nav>
        </header>

        <div className="os-arrival-grid">
          <div className="os-arrival-copy">
            <p className="os-arrival-eyebrow">{copy.arrival.eyebrow}</p>
            <h1>
              {copy.welcome.hero[0]}<br />
              {copy.welcome.hero[1]} <em>{copy.welcome.hero[2]}</em>
            </h1>
            <p className="os-arrival-lead">{copy.arrival.body}</p>
            <p className="os-arrival-proofline">{copy.arrival.proof}</p>

            <div className="os-arrival-actions">
              <p className="os-arrival-actions-label">{copy.arrival.choose}</p>
              <Link
                href={localizePath("/contact", locale)}
                className="os-arrival-primary"
                onClick={() => onRoute("start")}
              >
                <span><strong>{copy.welcome.intents.start[0]}</strong><small>{copy.welcome.intents.start[1]}</small></span>
                <em aria-hidden="true">→</em>
              </Link>
              <div className="os-arrival-secondary">
                <button type="button" onClick={onInspectWork}>
                  <span><strong>{copy.welcome.intents.work[0]}</strong><small>{copy.welcome.intents.work[1]}</small></span>
                  <em aria-hidden="true">↘</em>
                </button>
                <Link href={localizePath("/services#service-paths", locale)} onClick={() => onRoute("services")}>
                  <span><strong>{copy.welcome.intents.services[0]}</strong><small>{copy.welcome.intents.services[1]}</small></span>
                  <em aria-hidden="true">→</em>
                </Link>
              </div>
            </div>

            <div className="os-arrival-utility">
              <button type="button" className="os-arrival-enter" onClick={onEnter}>
                <span><strong>{copy.arrival.enter}</strong><small>{copy.arrival.enterHint}</small></span>
                <em aria-hidden="true">↘</em>
              </button>
              <Link href={localizePath("/profile", locale)} onClick={() => onRoute("profile")}>
                {copy.welcome.intents.profile[0]} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <div className="os-arrival-showcase">
            <div className="os-arrival-showcase-head">
              <span><i aria-hidden="true" />{copy.arrival.proofLabel}</span>
              <small>{copy.arrival.proofHint}</small>
            </div>
            <div className="os-arrival-tabs" role="tablist" aria-label={copy.arrival.proofHint}>
              {copy.workWindow.live.map((item, index) => (
                <button
                  key={item.tx}
                  type="button"
                  role="tab"
                  aria-selected={activeProof === index}
                  className={activeProof === index ? "is-active" : ""}
                  onClick={() => {
                    setActiveProof(index);
                    onProofSwitch(item.tx);
                  }}
                >
                  <span>{item.tx}</span>{item.name}
                </button>
              ))}
            </div>
            <div className="os-arrival-proof" key={proof.tx} role="tabpanel">
              <div className="os-arrival-image">
                <Image
                  src={proof.image}
                  alt={proof.alt}
                  width={proof.width}
                  height={proof.height}
                  sizes="(min-width: 1200px) 48vw, (min-width: 700px) 78vw, 92vw"
                />
                <span aria-hidden="true" />
              </div>
              <div className="os-arrival-proof-copy">
                <p><i aria-hidden="true" />{proof.status}</p>
                <h2>{proof.name}</h2>
                <small>{proof.proof}</small>
                <Link href={localizePath(proof.path, locale)} onClick={() => onRoute(`proof_${proof.tx.toLowerCase()}`)}>
                  {copy.workWindow.open} <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <footer className="os-arrival-footer">
          <span>MAYDAOS 26.08</span>
          <span>{copy.arrival.footer}</span>
        </footer>
      </div>
    </section>
  );
}
