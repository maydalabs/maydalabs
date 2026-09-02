"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isLocale, localizePath, type Locale } from "@/lib/i18n";

const COPY = {
  en: {
    kicker: "404 / Off the field",
    heading: ["This route leads", "nowhere yet."],
    body: "The page may have moved, never existed, or is still waiting to ship.",
    home: "Back to the homepage",
    contact: "Tell us what you expected",
  },
  tr: {
    kicker: "404 / Alanın dışında",
    heading: ["Bu rota henüz", "bir yere çıkmıyor."],
    body: "Sayfa taşınmış, hiç var olmamış veya henüz yayına alınmamış olabilir.",
    home: "Ana sayfaya dön",
    contact: "Ne aradığınızı anlatın",
  },
  fr: {
    kicker: "404 / Hors du champ",
    heading: ["Cette route ne mène", "encore nulle part."],
    body: "La page a peut-être été déplacée, n’a jamais existé ou attend encore sa mise en ligne.",
    home: "Retour à l’accueil",
    contact: "Dites-nous ce que vous cherchiez",
  },
} as const;

export default function NotFound() {
  const segment = usePathname().split("/").filter(Boolean)[0];
  const locale: Locale = segment && isLocale(segment) ? segment : "en";
  const copy = COPY[locale];

  return (
    <div className="mayda-shell mayda-section" style={{ textAlign: "center" }}>
      <div className="mayda-stack" style={{ alignItems: "center", gap: "1.2rem" }}>
        <p className="mayda-kicker">{copy.kicker}</p>
        <h1 className="mayda-display" style={{ fontSize: "clamp(2rem,5vw,3.4rem)" }}>
          {copy.heading[0]}
          <br />
          <span className="mayda-multiply">{copy.heading[1]}</span>
        </h1>
        <p className="mayda-body">{copy.body}</p>
        <div className="mayda-hero-actions" style={{ justifyContent: "center" }}>
          <Link href={localizePath("/", locale)} className="mayda-button">
            {copy.home}
          </Link>
          <Link href={localizePath("/contact", locale)} className="mayda-button mayda-button-outline">
            {copy.contact}
          </Link>
        </div>
      </div>
    </div>
  );
}
