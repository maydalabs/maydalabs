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
    profile: { eyebrow: "FOUNDER · PRODUCT · GROWTH", title: "Mehmet E. Mayda", accent: "Full-stack product builder" },
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
    profile: { eyebrow: "KURUCU · ÜRÜN · BÜYÜME", title: "Mehmet E. Mayda", accent: "Full-stack ürün geliştirici" },
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
    profile: { eyebrow: "FONDATEUR · PRODUIT · CROISSANCE", title: "Mehmet E. Mayda", accent: "Builder produit full-stack" },
    about: { eyebrow: "STUDIO DIRIGÉ PAR SON FONDATEUR", title: "Petite équipe. Grandes idées.", accent: "À propos" },
    contact: { eyebrow: "OUVERT À DE NOUVEAUX PROJETS", title: "Apportez l’idée encore floue.", accent: "Lancer un projet" },
    legal: { eyebrow: "MAYDALABS", title: "Des règles claires. Sans brouillard.", accent: "Juridique" },
  },
};

function renderDesktopCard(locale: Locale): ReactElement {
  const copy = CARD_COPY[locale].studio;
  const words = copy.title.split(" ");
  const lead = words.slice(0, -1).join(" ");
  const last = words[words.length - 1];

  return (
    <div style={{ position: "relative", display: "flex", width: "100%", height: "100%", overflow: "hidden", background: "#0a0a09", color: "#f2f0ea", fontFamily: "Arial, sans-serif" }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", opacity: 0.16, backgroundImage: "linear-gradient(rgba(242,240,234,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(242,240,234,.14) 1px, transparent 1px)", backgroundSize: "52px 52px" }} />
      <div style={{ position: "absolute", top: 40, right: -180, display: "flex", width: 760, height: 640, borderRadius: 999, background: "radial-gradient(circle, rgba(247,147,26,.26), rgba(9,9,9,0) 66%)" }} />

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "space-between", height: 54, padding: "0 30px", background: "rgba(12,12,11,.96)", borderBottom: "1px solid rgba(242,240,234,.12)" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <svg width="22" height="22" viewBox="0 0 40 40" fill="none" style={{ marginRight: 12 }}>
            <path d="M6 5H11L17 11V29L11 35H6V5Z" fill="#F2F0EA" />
            <path d="M34 5H29L23 11V29L29 35H34V5Z" fill="#F2F0EA" />
            <circle cx="20" cy="20" r="3.5" fill="#F39A36" />
          </svg>
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: 3 }}>MaydaOS</span>
          <span style={{ marginLeft: 34, color: "rgba(242,240,234,.55)", fontSize: 15 }}>Work</span>
          <span style={{ marginLeft: 22, color: "rgba(242,240,234,.55)", fontSize: 15 }}>Services</span>
          <span style={{ marginLeft: 22, color: "rgba(242,240,234,.55)", fontSize: 15 }}>About</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", color: "rgba(242,240,234,.5)", fontSize: 13, letterSpacing: 2 }}>
          <span>SND</span>
          <div style={{ display: "flex", width: 7, height: 7, marginLeft: 7, borderRadius: 999, background: "rgba(242,240,234,.3)" }} />
          <span style={{ marginLeft: 20 }}>EN · TR · FR</span>
          <span style={{ marginLeft: 20, color: "#f39a36" }}>BTC BROADCASTING</span>
        </div>
      </div>

      <div style={{ position: "absolute", top: 116, left: 64, display: "flex", flexDirection: "column", width: 620, borderRadius: 14, border: "1px solid rgba(247,147,26,.4)", background: "rgba(16,16,15,.98)", boxShadow: "0 40px 90px rgba(0,0,0,.6)" }}>
        <div style={{ display: "flex", alignItems: "center", height: 42, padding: "0 16px", borderBottom: "1px solid rgba(242,240,234,.1)" }}>
          <div style={{ display: "flex", width: 11, height: 11, borderRadius: 999, background: "#ff5b3d", marginRight: 7 }} />
          <div style={{ display: "flex", width: 11, height: 11, borderRadius: 999, background: "#ffc36d", marginRight: 7 }} />
          <div style={{ display: "flex", width: 11, height: 11, borderRadius: 999, background: "#d7ff68", marginRight: 14 }} />
          <span style={{ color: "rgba(242,240,234,.55)", fontSize: 13, letterSpacing: 2 }}>welcome — read me</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", padding: "26px 28px 30px" }}>
          <span style={{ color: "#f39a36", fontSize: 14, fontWeight: 700, letterSpacing: 3 }}>{copy.eyebrow}</span>
          <div style={{ display: "flex", flexWrap: "wrap", marginTop: 16, fontSize: 52, fontWeight: 600, lineHeight: 1.04, letterSpacing: -2 }}>
            <span>{lead}&nbsp;</span>
            <span style={{ color: "#f39a36" }}>{last}</span>
          </div>
          <span style={{ marginTop: 18, color: "rgba(242,240,234,.5)", fontSize: 18 }}>{copy.accent} · MAYDALABS.COM</span>
        </div>
      </div>

      <div style={{ position: "absolute", top: 148, right: 56, display: "flex", flexDirection: "column", width: 400, borderRadius: 14, border: "1px solid rgba(242,240,234,.16)", background: "rgba(13,13,12,.98)", boxShadow: "0 30px 70px rgba(0,0,0,.55)" }}>
        <div style={{ display: "flex", alignItems: "center", height: 38, padding: "0 14px", borderBottom: "1px solid rgba(242,240,234,.09)" }}>
          <span style={{ color: "rgba(242,240,234,.5)", fontSize: 12, letterSpacing: 2 }}>maydalabs — shell</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", padding: "14px 16px 18px", fontSize: 15 }}>
          <span style={{ color: "#f39a36" }}>$ proof</span>
          <span style={{ marginTop: 7, color: "rgba(242,240,234,.6)" }}>hodlstay.com — broadcasting</span>
          <span style={{ marginTop: 5, color: "rgba(242,240,234,.6)" }}>satoshigazette.org — broadcasting</span>
          <span style={{ marginTop: 9, display: "flex", color: "#f39a36" }}>$ <span style={{ display: "flex", width: 9, height: 17, marginLeft: 8, background: "#f2f0ea" }} /></span>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 26, left: 422, display: "flex", alignItems: "center", padding: "12px 16px", borderRadius: 18, border: "1px solid rgba(242,240,234,.15)", background: "rgba(18,18,16,.85)" }}>
        {[0, 1, 2, 3, 4, 5].map((tile) => (
          <div key={tile} style={{ display: "flex", width: 44, height: 44, marginRight: tile === 5 ? 0 : 12, borderRadius: 12, border: tile === 5 ? "1px solid rgba(247,147,26,.55)" : "1px solid rgba(242,240,234,.14)", background: tile === 5 ? "rgba(247,147,26,.14)" : "rgba(242,240,234,.05)" }} />
        ))}
      </div>

      <div style={{ position: "absolute", bottom: 40, left: 64, display: "flex", color: "rgba(242,240,234,.4)", fontSize: 13, letterSpacing: 3 }}>MAYDAOS 26.08</div>
      <div style={{ position: "absolute", bottom: 40, right: 60, display: "flex", color: "rgba(242,240,234,.4)", fontSize: 13, letterSpacing: 3 }}>ISTANBUL / EVERYWHERE</div>
    </div>
  );
}

const CARD_PATHS: Record<SocialCardKind, string> = {
  studio: "~",
  services: "~/services",
  work: "~/work",
  hodlstay: "~/work/tx-01-hodlstay",
  "satoshi-gazette": "~/work/tx-02-gazette",
  "mortal-vault": "~/work/tx-03-vault",
  sofra: "~/work/tx-04-sofra",
  profile: "~/profile",
  about: "~/about",
  contact: "~/contact",
  legal: "~/legal",
};

export function renderSocialCard(locale: Locale, kind: SocialCardKind): ReactElement {
  if (kind === "studio") return renderDesktopCard(locale);
  const copy = CARD_COPY[locale][kind];
  const words = copy.title.split(" ");
  const lead = words.slice(0, -1).join(" ");
  const last = words[words.length - 1];

  return (
    <div style={{ position: "relative", display: "flex", width: "100%", height: "100%", overflow: "hidden", background: "#0a0a09", color: "#f2f0ea", fontFamily: "Arial, sans-serif" }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", opacity: 0.16, backgroundImage: "linear-gradient(rgba(242,240,234,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(242,240,234,.14) 1px, transparent 1px)", backgroundSize: "52px 52px" }} />
      <div style={{ position: "absolute", top: -140, right: -220, display: "flex", width: 760, height: 700, borderRadius: 999, background: "radial-gradient(circle, rgba(247,147,26,.24), rgba(9,9,9,0) 66%)" }} />

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "space-between", height: 52, padding: "0 30px", background: "rgba(12,12,11,.96)", borderBottom: "1px solid rgba(242,240,234,.12)" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <svg width="21" height="21" viewBox="0 0 40 40" fill="none" style={{ marginRight: 12 }}>
            <path d="M6 5H11L17 11V29L11 35H6V5Z" fill="#F2F0EA" />
            <path d="M34 5H29L23 11V29L29 35H34V5Z" fill="#F2F0EA" />
            <circle cx="20" cy="20" r="3.5" fill="#F39A36" />
          </svg>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: 3 }}>MaydaOS</span>
        </div>
        <span style={{ color: "rgba(242,240,234,.45)", fontSize: 13, letterSpacing: 3 }}>ISTANBUL / EVERYWHERE</span>
      </div>

      <div style={{ position: "absolute", top: 122, left: 110, display: "flex", flexDirection: "column", width: 980, borderRadius: 16, border: "1px solid rgba(247,147,26,.38)", background: "rgba(15,15,14,.99)", boxShadow: "0 48px 110px rgba(0,0,0,.62)" }}>
        <div style={{ display: "flex", alignItems: "center", height: 46, padding: "0 18px", borderBottom: "1px solid rgba(242,240,234,.1)" }}>
          <div style={{ display: "flex", width: 12, height: 12, borderRadius: 999, background: "#ff5b3d", marginRight: 7 }} />
          <div style={{ display: "flex", width: 12, height: 12, borderRadius: 999, background: "#ffc36d", marginRight: 7 }} />
          <div style={{ display: "flex", width: 12, height: 12, borderRadius: 999, background: "#d7ff68", marginRight: 16 }} />
          <span style={{ color: "rgba(242,240,234,.55)", fontSize: 15, letterSpacing: 2 }}>{CARD_PATHS[kind]}</span>
          <span style={{ marginLeft: "auto", color: "rgba(242,240,234,.3)", fontSize: 12, letterSpacing: 2 }}>MAYDAOS 26.08</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", padding: "40px 46px 46px" }}>
          <span style={{ color: "#f39a36", fontSize: 16, fontWeight: 700, letterSpacing: 3 }}>{copy.eyebrow}</span>
          <div style={{ display: "flex", flexWrap: "wrap", marginTop: 22, fontSize: 62, fontWeight: 600, lineHeight: 1.02, letterSpacing: -2.5 }}>
            {lead ? <span>{lead}&nbsp;</span> : null}
            <span style={{ color: "#f39a36" }}>{last}</span>
          </div>
          <span style={{ marginTop: 24, color: "rgba(242,240,234,.5)", fontSize: 21 }}>{copy.accent} · MAYDALABS.COM</span>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 36, left: 110, display: "flex", alignItems: "center", color: "rgba(242,240,234,.4)", fontSize: 13, letterSpacing: 3 }}>
        <div style={{ display: "flex", width: 8, height: 8, borderRadius: 999, background: "#d7ff68", marginRight: 10 }} />
        BROADCASTING FROM MAYDAOS
      </div>
    </div>
  );
}
