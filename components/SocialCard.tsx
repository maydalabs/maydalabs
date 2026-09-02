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
    studio: { eyebrow: "Bitcoin operations company", title: "AI runs the work. You approve every action." },
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
    auth: { eyebrow: "Sign in", title: "A six-digit code. No password." },
    legal: { eyebrow: "MaydaLabs", title: "The fine print, kept honest." },
  },
  tr: {
    studio: { eyebrow: "Bitcoin operasyon şirketi", title: "İşi yapay zekâ yapar. Her eylemi siz onaylarsınız." },
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
    auth: { eyebrow: "Giriş", title: "Altı haneli kod. Parola yok." },
    legal: { eyebrow: "MaydaLabs", title: "Küçük yazılar, dürüst tutulur." },
  },
  fr: {
    studio: { eyebrow: "Opérations Bitcoin", title: "L'IA fait le travail. Vous approuvez chaque action." },
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
    auth: { eyebrow: "Connexion", title: "Un code à six chiffres. Sans mot de passe." },
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
        width="560"
        height="420"
        viewBox="0 0 520 372"
        style={{ position: "absolute", right: 24, top: 105, opacity: 0.9 }}
      >
        <path d="M10 186 H 150" stroke={COBALT} strokeWidth="3" fill="none" />
        {[46, 116, 186, 256, 326].map((endY) => (
          <path
            key={endY}
            d={`M150 186 C 250 186, 300 ${endY}, 466 ${endY}`}
            stroke={COBALT}
            strokeWidth="2"
            strokeOpacity="0.55"
            fill="none"
          />
        ))}
        <circle cx="150" cy="186" r="7" fill={VOID} stroke={COBALT} strokeWidth="3" />
        {[46, 116, 186, 256, 326].map((endY) => (
          <circle key={endY} cx="466" cy={endY} r="5" fill={MINT} />
        ))}
      </svg>

      <div style={{ display: "flex", alignItems: "baseline" }}>
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
