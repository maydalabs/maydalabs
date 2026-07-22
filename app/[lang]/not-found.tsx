"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isLocale, localizePath, type Locale } from "@/lib/i18n";

const COPY = {
  en: {
    kicker: "404 / Signal lost",
    heading: ["This route went", "off the map."],
    body: "The page may have moved, never existed, or is still waiting to ship.",
    home: "Return to the studio",
    contact: "Tell us what you expected",
  },
  tr: {
    kicker: "404 / Sinyal kayboldu",
    heading: ["Bu rota", "haritadan çıktı."],
    body: "Sayfa taşınmış, hiç var olmamış veya henüz yayına alınmamış olabilir.",
    home: "Stüdyoya dön",
    contact: "Ne aradığınızı anlatın",
  },
  fr: {
    kicker: "404 / Signal perdu",
    heading: ["Cette route a quitté", "la carte."],
    body: "La page a peut-être été déplacée, n’a jamais existé ou attend encore sa mise en ligne.",
    home: "Retourner au studio",
    contact: "Dites-nous ce que vous cherchiez",
  },
} as const;

export default function NotFound() {
  const segment = usePathname().split("/").filter(Boolean)[0];
  const locale: Locale = segment && isLocale(segment) ? segment : "en";
  const copy = COPY[locale];

  return (
    <div className="studio-inner-page">
      <section className="studio-inner-hero">
        <p className="studio-kicker">{copy.kicker}</p>
        <h1>
          {copy.heading[0]}
          <br />
          <em>{copy.heading[1]}</em>
        </h1>
        <p>{copy.body}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href={localizePath("/", locale)} className="studio-button">
            {copy.home} <span aria-hidden>↗</span>
          </Link>
          <Link href={localizePath("/contact", locale)} className="studio-button studio-button-ghost">
            {copy.contact}
          </Link>
        </div>
      </section>
    </div>
  );
}
