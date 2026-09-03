import type { Locale } from "@/lib/i18n";
import type { SocialCardKind } from "@/lib/metadata";

/*
 * 1200×630 social card in the Multiplier Field system: void ground, the
 * one-input-to-many-outputs figure, typographic wordmark. Rendered by
 * next/og (Satori) — inline styles only.
 */

const VOID = "#0A0B0F";
const FROST = "#F4F7FA";
const COBALT = "#4B6BFF";
const MINT = "#42F5B6";
const MIST = "#AAB2C0";

type CardCopy = { eyebrow: string; title: string };

const CARD_COPY: Record<Locale, Record<SocialCardKind, CardCopy>> = {
  en: {
    studio: { eyebrow: "AI-run operations, human-approved", title: "Let AI run your operation while you stay in control!" },
    proof: { eyebrow: "Proof · Live system", title: "The system behind Satoshi Gazette." },
    start: { eyebrow: "Multiplier Map · Free diagnostic", title: "Map my next move." },
    approach: { eyebrow: "Offers", title: "Two offers, both already in production." },
    work: { eyebrow: "Selected work", title: "Real products, clearly labelled." },
    hodlstay: { eyebrow: "Client build · Live", title: "HodlStay: a global stay marketplace." },
    "satoshi-gazette": { eyebrow: "Owned publication · Live", title: "Satoshi Gazette: a newsroom built as a product." },
    "mortal-vault": { eyebrow: "Lab product · Private alpha", title: "Mortal Vault: Bitcoin inheritance, unaudited." },
    sofra: { eyebrow: "Lab product · Private Phase 1", title: "Sofra: a marketplace foundation." },
    profile: { eyebrow: "Founder", title: "Mehmet E. Mayda." },
    about: { eyebrow: "About", title: "Founder-led, evidence first." },
    contact: { eyebrow: "Start a conversation", title: "Bring the constraint." },
    portal: { eyebrow: "Portal", title: "Your maps and briefs." },
    auth: { eyebrow: "Sign in", title: "A one-time code. No password." },
    legal: { eyebrow: "MaydaLabs", title: "The fine print, kept honest." },
  },
  tr: {
    studio: { eyebrow: "Yapay zekâ ile çalışan, insan onaylı operasyonlar", title: "Operasyonunuzu yapay zekâ yürütsün, kontrol sizde kalsın!" },
    proof: { eyebrow: "Kanıt · Canlı sistem", title: "Satoshi Gazette'in arkasındaki sistem." },
    start: { eyebrow: "Multiplier Map · Ücretsiz tanı", title: "Sonraki hamlemi haritala." },
    approach: { eyebrow: "Teklifler", title: "İki teklif, ikisi de üretimde." },
    work: { eyebrow: "Seçili işler", title: "Gerçek ürünler, net etiketler." },
    hodlstay: { eyebrow: "Müşteri ürünü · Canlı", title: "HodlStay: küresel konaklama pazarı." },
    "satoshi-gazette": { eyebrow: "Sahip olunan yayın · Canlı", title: "Satoshi Gazette: ürün olarak kurulmuş bir haber odası." },
    "mortal-vault": { eyebrow: "Lab ürünü · Özel alfa", title: "Mortal Vault: Bitcoin mirası, denetimsiz." },
    sofra: { eyebrow: "Lab ürünü · Özel Faz 1", title: "Sofra: bir pazar yeri temeli." },
    profile: { eyebrow: "Kurucu", title: "Mehmet E. Mayda." },
    about: { eyebrow: "Hakkında", title: "Kurucu liderliğinde, önce kanıt." },
    contact: { eyebrow: "Bir görüşme başlatın", title: "Kısıtı getirin." },
    portal: { eyebrow: "Portal", title: "Haritalarınız ve brief'leriniz." },
    auth: { eyebrow: "Giriş", title: "Tek kullanımlık kod. Parola yok." },
    legal: { eyebrow: "MaydaLabs", title: "Küçük yazılar, dürüst tutulur." },
  },
  fr: {
    studio: { eyebrow: "Opérations IA, approuvées par un humain", title: "Laissez l'IA faire tourner votre opération, vous gardez le contrôle !" },
    proof: { eyebrow: "Preuve · Système en direct", title: "Le système derrière Satoshi Gazette." },
    start: { eyebrow: "Multiplier Map · Diagnostic gratuit", title: "Cartographier ma prochaine étape." },
    approach: { eyebrow: "Offres", title: "Deux offres, déjà en production." },
    work: { eyebrow: "Réalisations", title: "De vrais produits, clairement étiquetés." },
    hodlstay: { eyebrow: "Produit client · En ligne", title: "HodlStay : une marketplace mondiale de séjours." },
    "satoshi-gazette": { eyebrow: "Publication détenue · En ligne", title: "Satoshi Gazette : une rédaction construite comme un produit." },
    "mortal-vault": { eyebrow: "Produit lab · Alpha privée", title: "Mortal Vault : héritage Bitcoin, non audité." },
    sofra: { eyebrow: "Produit lab · Phase 1 privée", title: "Sofra : une fondation de marketplace." },
    profile: { eyebrow: "Fondateur", title: "Mehmet E. Mayda." },
    about: { eyebrow: "À propos", title: "Dirigé par le fondateur, preuves d’abord." },
    contact: { eyebrow: "Démarrer un échange", title: "Apportez la contrainte." },
    portal: { eyebrow: "Portail", title: "Vos cartes et vos briefs." },
    auth: { eyebrow: "Connexion", title: "Un code à usage unique. Sans mot de passe." },
    legal: { eyebrow: "MaydaLabs", title: "Les petites lignes, honnêtes." },
  },
};

export function renderSocialCard(locale: Locale, kind: SocialCardKind) {
  const copy = CARD_COPY[locale][kind];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: VOID,
        color: FROST,
        padding: 64,
        fontFamily: "Arial, sans-serif",
        position: "relative",
      }}
    >
      <svg
        width="400"
        height="400"
        viewBox="0 0 32 32"
        style={{ position: "absolute", right: 72, top: 115, opacity: 0.92 }}
      >
        <rect x="4" y="4" width="24" height="24" rx="6.5" fill="none" stroke={COBALT} strokeWidth="1.6" />
        <path d="M8.5 12.5C11.5 12.5 11 16 13 16" fill="none" stroke={MINT} strokeWidth="1.6" strokeLinecap="round" />
        <path d="M8.5 19.5C11.5 19.5 11 16 13 16" fill="none" stroke={MINT} strokeWidth="1.6" strokeLinecap="round" />
        <path d="M17 10V22" fill="none" stroke={MINT} strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="22.5" cy="16" r="1.6" fill={MINT} />
      </svg>

      <div style={{ display: "flex", alignItems: "center" }}>
        <svg width="44" height="44" viewBox="0 0 32 32" style={{ marginRight: 14 }}>
          <rect x="4" y="4" width="24" height="24" rx="6.5" fill="none" stroke={COBALT} strokeWidth="2.7" />
          <path d="M8.5 12.5C11.5 12.5 11 16 13 16" fill="none" stroke={MINT} strokeWidth="2.7" strokeLinecap="round" />
          <path d="M8.5 19.5C11.5 19.5 11 16 13 16" fill="none" stroke={MINT} strokeWidth="2.7" strokeLinecap="round" />
          <path d="M17 10V22" fill="none" stroke={MINT} strokeWidth="2.7" strokeLinecap="round" />
          <circle cx="22.5" cy="16" r="2.1" fill={MINT} />
        </svg>
        <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1 }}>MaydaLabs</span>
        <span style={{ fontSize: 22, fontWeight: 700, color: COBALT, marginLeft: 4, marginBottom: 14 }}>×</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", maxWidth: 620 }}>
        <span
          style={{
            fontSize: 22,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: MINT,
            marginBottom: 18,
          }}
        >
          {copy.eyebrow}
        </span>
        <span style={{ fontSize: 58, fontWeight: 700, letterSpacing: -2, lineHeight: 1.08 }}>
          {copy.title}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 20,
          color: MIST,
          letterSpacing: 2,
        }}
      >
        <span>maydalabs.com</span>
        <span>ISTANBUL / EVERYWHERE</span>
      </div>
    </div>
  );
}
