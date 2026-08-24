import type { ReactElement } from "react";
import type { Locale } from "@/lib/i18n";
import type { SocialCardKind } from "@/lib/metadata";

const CARD_COPY: Record<Locale, Record<SocialCardKind, { eyebrow: string; title: string; accent: string }>> = {
  en: {
    studio: { eyebrow: "PRODUCT · COMMERCE · GROWTH", title: "Software people can feel.", accent: "MaydaLabs" },
    services: { eyebrow: "ONE CONNECTED STUDIO", title: "Three ways to move.", accent: "Services" },
    work: { eyebrow: "SELECTED WORK", title: "Proof, not promises.", accent: "Flagships" },
    hodlstay: { eyebrow: "MARKETPLACE · TRAVEL · BITCOIN", title: "A global stay marketplace.", accent: "HodlStay" },
    "satoshi-gazette": { eyebrow: "MEDIA · DATA · EDITORIAL OPS", title: "A newsroom as a product.", accent: "Satoshi Gazette" },
    "mortal-vault": { eyebrow: "PRIVATE ALPHA · SELF-CUSTODY", title: "Continuity without custody.", accent: "Mortal Vault" },
    sofra: { eyebrow: "PRIVATE PHASE 1 · MARKETPLACE", title: "Trust, built around a table.", accent: "Sofra" },
    about: { eyebrow: "FOUNDER-LED STUDIO", title: "Small team. Serious ideas.", accent: "About" },
    contact: { eyebrow: "OPEN FOR NEW CLIENT WORK", title: "Bring the messy idea.", accent: "Start a project" },
    legal: { eyebrow: "MAYDALABS", title: "Clear terms. No fog.", accent: "Legal" },
  },
  tr: {
    studio: { eyebrow: "ÜRÜN · E-TİCARET · BÜYÜME", title: "İnsanların hissedebileceği yazılımlar.", accent: "MaydaLabs" },
    services: { eyebrow: "TEK VE BAĞLANTILI STÜDYO", title: "İlerlemenin üç yolu.", accent: "Hizmetler" },
    work: { eyebrow: "SEÇİLİ PROJELER", title: "Vaat değil, kanıt.", accent: "Amiral projeler" },
    hodlstay: { eyebrow: "PAZAR YERİ · SEYAHAT · BITCOIN", title: "Küresel bir konaklama pazarı.", accent: "HodlStay" },
    "satoshi-gazette": { eyebrow: "MEDYA · VERİ · EDİTORYAL OPERASYON", title: "Bir ürün olarak haber merkezi.", accent: "Satoshi Gazette" },
    "mortal-vault": { eyebrow: "ÖZEL ALPHA · SELF-CUSTODY", title: "Saklama olmadan süreklilik.", accent: "Mortal Vault" },
    sofra: { eyebrow: "ÖZEL PHASE 1 · PAZAR YERİ", title: "Sofra etrafında kurulan güven.", accent: "Sofra" },
    about: { eyebrow: "KURUCU LİDERLİĞİNDE STÜDYO", title: "Küçük ekip. Ciddi fikirler.", accent: "Hakkımızda" },
    contact: { eyebrow: "YENİ MÜŞTERİ PROJELERİNE AÇIK", title: "Dağınık fikri getirin.", accent: "Proje başlat" },
    legal: { eyebrow: "MAYDALABS", title: "Açık koşullar. Belirsizlik yok.", accent: "Yasal" },
  },
  fr: {
    studio: { eyebrow: "PRODUIT · E-COMMERCE · CROISSANCE", title: "Du logiciel que l’on ressent.", accent: "MaydaLabs" },
    services: { eyebrow: "UN STUDIO CONNECTÉ", title: "Trois façons d’avancer.", accent: "Services" },
    work: { eyebrow: "PROJETS SÉLECTIONNÉS", title: "Des preuves, pas des promesses.", accent: "Projets phares" },
    hodlstay: { eyebrow: "MARKETPLACE · VOYAGE · BITCOIN", title: "Une marketplace mondiale de séjours.", accent: "HodlStay" },
    "satoshi-gazette": { eyebrow: "MÉDIA · DONNÉES · OPÉRATIONS", title: "Une rédaction conçue comme un produit.", accent: "Satoshi Gazette" },
    "mortal-vault": { eyebrow: "ALPHA PRIVÉE · AUTOGARDE", title: "La continuité sans dépositaire.", accent: "Mortal Vault" },
    sofra: { eyebrow: "PHASE 1 PRIVÉE · MARKETPLACE", title: "La confiance autour d’une table.", accent: "Sofra" },
    about: { eyebrow: "STUDIO DIRIGÉ PAR SON FONDATEUR", title: "Petite équipe. Grandes idées.", accent: "À propos" },
    contact: { eyebrow: "OUVERT À DE NOUVEAUX PROJETS", title: "Apportez l’idée encore floue.", accent: "Lancer un projet" },
    legal: { eyebrow: "MAYDALABS", title: "Des règles claires. Sans brouillard.", accent: "Juridique" },
  },
};

export function renderSocialCard(locale: Locale, kind: SocialCardKind): ReactElement {
  const copy = CARD_COPY[locale][kind];

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "#090909",
        color: "#f2f0ea",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ position: "absolute", inset: 0, display: "flex", opacity: 0.22, backgroundImage: "linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)", backgroundSize: "58px 58px" }} />
      <div style={{ position: "absolute", top: -280, right: -120, display: "flex", width: 720, height: 720, borderRadius: 999, background: "radial-gradient(circle, rgba(247,147,26,.34), rgba(9,9,9,0) 68%)" }} />
      <div style={{ position: "absolute", top: 92, right: 92, display: "flex", width: 330, height: 330, border: "1px solid rgba(242,240,234,.16)", borderRadius: 999 }} />
      <div style={{ position: "absolute", top: 147, right: 147, display: "flex", width: 220, height: 220, border: "1px solid rgba(247,147,26,.45)", borderRadius: 999 }} />
      <div style={{ position: "absolute", top: 241, right: 241, display: "flex", width: 32, height: 32, borderRadius: 999, background: "#f39a36", boxShadow: "0 0 44px rgba(247,147,26,.9)" }} />

      <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", width: "78%", padding: "58px 62px 52px" }}>
        <div style={{ display: "flex", alignItems: "center", fontSize: 19, fontWeight: 700, letterSpacing: 5 }}>
          <svg width="34" height="34" viewBox="0 0 40 40" fill="none" style={{ marginRight: 16 }}>
            <path d="M6 5H11L17 11V29L11 35H6V5Z" fill="#F2F0EA" />
            <path d="M34 5H29L23 11V29L29 35H34V5Z" fill="#F2F0EA" />
            <circle cx="20" cy="20" r="3.5" fill="#F39A36" />
          </svg>
          MAYDALABS
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ color: "#f39a36", fontSize: 16, fontWeight: 700, letterSpacing: 3 }}>{copy.eyebrow}</span>
          <span style={{ display: "flex", maxWidth: 820, marginTop: 24, fontSize: 68, fontWeight: 600, lineHeight: 0.98, letterSpacing: -4 }}>{copy.title}</span>
          <span style={{ marginTop: 28, color: "rgba(242,240,234,.55)", fontSize: 23 }}>{copy.accent}</span>
        </div>

        <div style={{ display: "flex", color: "rgba(242,240,234,.42)", fontSize: 15, letterSpacing: 3 }}>MAYDALABS.COM · ISTANBUL / EVERYWHERE</div>
      </div>

      <div style={{ position: "absolute", right: 0, bottom: 0, display: "flex", width: 22, height: 180, background: "#f39a36" }} />
    </div>
  );
}
