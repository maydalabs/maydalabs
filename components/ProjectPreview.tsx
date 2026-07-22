"use client";

import Image from "next/image";
import { useState, type KeyboardEvent, type PointerEvent } from "react";
import type { Locale } from "@/lib/i18n";

type ProjectPreviewProps = {
  variant: "hodl" | "gazette";
  domain: string;
  status: string;
  imageSrc: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  watermarkSrc: string;
  watermarkWidth: number;
  watermarkHeight: number;
  watermarkClassName: string;
  locale: Locale;
};

const PREVIEW_COPY = {
  en: {
    anatomy: "System anatomy",
    inspect: "Hold to inspect system",
    inspectLabel: "Hold to inspect the systems behind",
    hodl: [["01", "Discovery", "Native and partner inventory"], ["02", "Transaction", "Booking and payment state"], ["03", "Operations", "Hosts, calendars, and payouts"], ["04", "Trust", "Reviews and support lifecycle"]],
    gazette: [["01", "Intelligence", "Markets and source context"], ["02", "Editorial", "Desks, stories, and briefings"], ["03", "Operations", "Publishing and distribution"], ["04", "Knowledge", "Search and assisted research"]],
  },
  tr: {
    anatomy: "Sistem anatomisi",
    inspect: "Sistemi incelemek için basılı tut",
    inspectLabel: "Arka plandaki sistemleri incelemek için basılı tut",
    hodl: [["01", "Keşif", "Yerel ve iş ortağı envanteri"], ["02", "İşlem", "Rezervasyon ve ödeme durumu"], ["03", "Operasyon", "Ev sahipleri, takvimler ve ödemeler"], ["04", "Güven", "Yorumlar ve destek yaşam döngüsü"]],
    gazette: [["01", "İstihbarat", "Piyasalar ve kaynak bağlamı"], ["02", "Editoryal", "Masalar, haberler ve bültenler"], ["03", "Operasyon", "Yayınlama ve dağıtım"], ["04", "Bilgi", "Arama ve destekli araştırma"]],
  },
  fr: {
    anatomy: "Anatomie du système",
    inspect: "Maintenir pour inspecter",
    inspectLabel: "Maintenir pour inspecter les systèmes derrière",
    hodl: [["01", "Découverte", "Inventaire natif et partenaire"], ["02", "Transaction", "État des réservations et paiements"], ["03", "Opérations", "Hôtes, calendriers et versements"], ["04", "Confiance", "Avis et cycle d’assistance"]],
    gazette: [["01", "Intelligence", "Marchés et contexte des sources"], ["02", "Éditorial", "Rubriques, articles et briefings"], ["03", "Opérations", "Publication et distribution"], ["04", "Connaissance", "Recherche et assistance"]],
  },
} as const;

export function ProjectPreview({
  locale,
  variant,
  domain,
  status,
  imageSrc,
  imageAlt,
  imageWidth,
  imageHeight,
  watermarkSrc,
  watermarkWidth,
  watermarkHeight,
  watermarkClassName,
}: ProjectPreviewProps) {
  const [inspecting, setInspecting] = useState(false);
  const copy = PREVIEW_COPY[locale];

  const beginInspection = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setInspecting(true);
  };

  const endInspection = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setInspecting(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      setInspecting(true);
    }
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === " " || event.key === "Enter") setInspecting(false);
  };

  return (
    <div className={`project-preview-shell ${inspecting ? "is-inspecting" : ""}`}>
      <div className={`project-browser project-browser-${variant}`}>
        <div className="project-browser-chrome">
          <div><i /><i /><i /></div>
          <span>{domain}</span>
          <b>{status}</b>
        </div>
        <div className="project-screen-stage">
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={imageWidth}
            height={imageHeight}
            sizes="(max-width: 900px) 100vw, 62vw"
            className="project-screen"
          />
          <div className="project-xray" aria-hidden="true">
            <div className="project-xray-grid" />
            <p>{copy.anatomy} / {domain}</p>
            <div className="project-xray-layers">
              {copy[variant].map(([number, title, detail]) => (
                <div key={number}>
                  <span>{number}</span>
                  <strong>{title}</strong>
                  <small>{detail}</small>
                </div>
              ))}
            </div>
            <i className="project-xray-route" />
          </div>
        </div>
        <Image
          src={watermarkSrc}
          alt=""
          width={watermarkWidth}
          height={watermarkHeight}
          className={`project-watermark ${watermarkClassName}`}
        />
      </div>
      <button
        type="button"
        className="project-inspect-button"
        aria-label={`${copy.inspectLabel} ${domain}`}
        aria-pressed={inspecting}
        onPointerDown={beginInspection}
        onPointerUp={endInspection}
        onPointerCancel={() => setInspecting(false)}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onBlur={() => setInspecting(false)}
      >
        <span /> {copy.inspect}
      </button>
    </div>
  );
}
