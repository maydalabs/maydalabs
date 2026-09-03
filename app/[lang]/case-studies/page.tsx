import Image from "next/image";
import Link from "next/link";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { createPageMetadata } from "@/lib/metadata";

const COPY = {
  en: {
    meta: {
      title: "Work",
      socialTitle: "Real products, clearly labelled · MaydaLabs",
      description:
        "Four MaydaLabs cases: two live products you can open today, two private lab builds with their boundaries stated plainly. Every case is labelled by ownership and status.",
    },
    kicker: "Work / Evidence with status",
    heading: ["Real products.", "Honest labels."],
    intro:
      "Two products are live and open to inspect right now. Two are private lab builds whose boundaries are stated plainly. Every case tells you what the situation was, what exactly MaydaLabs owned, what shipped, and who owns the result.",
    open: "Open the case",
    cases: [
      {
        id: "hodlstay",
        image: "/work/hodlstay-2026-09-home.jpg",
        alt: "Current HodlStay global booking marketplace homepage",
        tags: ["Client build", "Live"],
        name: "HodlStay",
        text: "A global stay marketplace rebuilt from AirBTC: discovery, host operations, availability, Bitcoin payments, and migration as one system.",
      },
      {
        id: "satoshi-gazette",
        image: "/work/satoshi-gazette-2026-09-home.jpg",
        alt: "Current Satoshi Gazette newsroom homepage",
        tags: ["Owned publication", "Live"],
        name: "Satoshi Gazette",
        text: "An independent Bitcoin publication built and operated as a product: editorial surfaces, data desks, and a guarded publishing pipeline.",
      },
      {
        id: "mortal-vault",
        image: "/work/mortal-vault-demo-home.jpg",
        alt: "Mortal Vault owner interface demo screen",
        tags: ["Lab product", "Private alpha · Unaudited"],
        name: "Mortal Vault",
        text: "A self-custodial continuity vault: owner check-ins, delayed beneficiary claims, and security work treated as a release gate.",
      },
      {
        id: "sofra",
        image: "/work/sofra-demo-home.jpg",
        alt: "Sofra marketplace demo screen with fictional data",
        tags: ["Lab product", "Private Phase 1 · Demo-safe"],
        name: "Sofra",
        text: "A managed household dinner marketplace where trust and privacy boundaries are part of the product model. Demo data only.",
      },
    ],
    disciplineKicker: "How proof works here",
    discipline:
      "Client work is labelled client work. Owned products are labelled owned. Private-stage builds say exactly what is and isn't claimed. No metrics appear unless the underlying source can be inspected, and no testimonial appears unless a real client approved its exact wording.",
    ctaHeading: "Match your situation to the work.",
    mapCta: "Map my next move",
    talkCta: "Start a conversation",
  },
  tr: {
    meta: {
      title: "Projeler",
      socialTitle: "Gerçek ürünler, net etiketler · MaydaLabs",
      description:
        "Dört MaydaLabs vakası: bugün açabileceğiniz iki canlı ürün, sınırları açıkça belirtilmiş iki özel lab geliştirmesi. Her vaka sahiplik ve durumla etiketlidir.",
    },
    kicker: "Projeler / Durumuyla birlikte kanıt",
    heading: ["Gerçek ürünler.", "Dürüst etiketler."],
    intro:
      "İki ürün canlı ve şu anda incelenebilir. İkisi, sınırları açıkça belirtilen özel lab geliştirmeleri. Her vaka durumun ne olduğunu, MaydaLabs'in tam olarak neyi üstlendiğini, neyin yayınlandığını ve sonucun kime ait olduğunu söyler.",
    open: "Vakayı aç",
    cases: [
      {
        id: "hodlstay",
        image: "/work/hodlstay-2026-09-home.jpg",
        alt: "Güncel HodlStay küresel rezervasyon pazarı ana sayfası",
        tags: ["Müşteri ürünü", "Canlı"],
        name: "HodlStay",
        text: "AirBTC'den yeniden kurulan küresel konaklama pazarı: keşif, ev sahibi operasyonları, uygunluk, Bitcoin ödemeleri ve veri göçü tek sistem olarak.",
      },
      {
        id: "satoshi-gazette",
        image: "/work/satoshi-gazette-2026-09-home.jpg",
        alt: "Güncel Satoshi Gazette haber merkezi ana sayfası",
        tags: ["Sahip olunan yayın", "Canlı"],
        name: "Satoshi Gazette",
        text: "Ürün olarak inşa edilip işletilen bağımsız bir Bitcoin yayını: editoryal yüzeyler, veri masaları ve korumalı yayınlama hattı.",
      },
      {
        id: "mortal-vault",
        image: "/work/mortal-vault-demo-home.jpg",
        alt: "Mortal Vault sahip arayüzü demo ekranı",
        tags: ["Lab ürünü", "Özel alfa · Denetlenmedi"],
        name: "Mortal Vault",
        text: "Self-custody süreklilik kasası: sahip check-in'leri, gecikmeli lehtar talepleri ve sürüm kapısı olarak ele alınan güvenlik çalışması.",
      },
      {
        id: "sofra",
        image: "/work/sofra-demo-home.jpg",
        alt: "Kurgusal verilerle Sofra pazar yeri demo ekranı",
        tags: ["Lab ürünü", "Özel Faz 1 · Demo güvenli"],
        name: "Sofra",
        text: "Güven ve gizlilik sınırlarının ürün modelinin parçası olduğu yönetilen ev yemeği pazarı. Yalnızca demo verisi.",
      },
    ],
    disciplineKicker: "Burada kanıt nasıl çalışır",
    discipline:
      "Müşteri işi müşteri işi olarak etiketlenir. Sahip olunan ürünler sahip olunan olarak. Özel aşamadaki geliştirmeler neyin iddia edilip edilmediğini tam olarak söyler. Kaynağı denetlenemeyen hiçbir metrik ve tam ifadesi gerçek bir müşteri tarafından onaylanmamış hiçbir referans burada yer almaz.",
    ctaHeading: "Durumunuzu işle eşleştirin.",
    mapCta: "Sonraki hamlemi haritala",
    talkCta: "Bir görüşme başlat",
  },
  fr: {
    meta: {
      title: "Réalisations",
      socialTitle: "De vrais produits, clairement étiquetés · MaydaLabs",
      description:
        "Quatre cas MaydaLabs : deux produits en ligne à ouvrir aujourd'hui, deux builds de lab privés aux limites clairement énoncées. Chaque cas est étiqueté par propriété et statut.",
    },
    kicker: "Réalisations / Preuves et statut",
    heading: ["De vrais produits.", "Des étiquettes honnêtes."],
    intro:
      "Deux produits sont en ligne et inspectables maintenant. Deux sont des builds de lab privés aux limites clairement énoncées. Chaque cas dit quelle était la situation, ce que MaydaLabs a exactement pris en charge, ce qui a été livré et à qui appartient le résultat.",
    open: "Ouvrir le cas",
    cases: [
      {
        id: "hodlstay",
        image: "/work/hodlstay-2026-09-home.jpg",
        alt: "Page d'accueil actuelle de la marketplace mondiale HodlStay",
        tags: ["Produit client", "En ligne"],
        name: "HodlStay",
        text: "Une marketplace mondiale de séjours reconstruite depuis AirBTC : découverte, opérations hôtes, disponibilité, paiements Bitcoin et migration en un seul système.",
      },
      {
        id: "satoshi-gazette",
        image: "/work/satoshi-gazette-2026-09-home.jpg",
        alt: "Page d'accueil actuelle de la rédaction Satoshi Gazette",
        tags: ["Publication détenue", "En ligne"],
        name: "Satoshi Gazette",
        text: "Une publication Bitcoin indépendante construite et opérée comme un produit : surfaces éditoriales, data desks et pipeline de publication contrôlé.",
      },
      {
        id: "mortal-vault",
        image: "/work/mortal-vault-demo-home.jpg",
        alt: "Écran de démo de l'interface propriétaire Mortal Vault",
        tags: ["Produit lab", "Alpha privée · Non auditée"],
        name: "Mortal Vault",
        text: "Un coffre de continuité en autogarde : check-ins du propriétaire, réclamations différées et sécurité traitée comme condition de sortie.",
      },
      {
        id: "sofra",
        image: "/work/sofra-demo-home.jpg",
        alt: "Écran de démo de la marketplace Sofra avec données fictives",
        tags: ["Produit lab", "Phase 1 privée · Démo sûre"],
        name: "Sofra",
        text: "Une marketplace gérée de dîners chez l'habitant où confiance et confidentialité font partie du modèle produit. Données de démo uniquement.",
      },
    ],
    disciplineKicker: "Comment la preuve fonctionne ici",
    discipline:
      "Le travail client est étiqueté travail client. Les produits détenus sont étiquetés détenus. Les builds en phase privée disent exactement ce qui est revendiqué et ce qui ne l'est pas. Aucune métrique n'apparaît sans source inspectable, et aucun témoignage sans l'accord d'un vrai client sur sa formulation exacte.",
    ctaHeading: "Reliez votre situation au travail.",
    mapCta: "Cartographier ma prochaine étape",
    talkCta: "Démarrer un échange",
  },
} as const;

export async function generateMetadata({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  return createPageMetadata({ ...COPY[locale].meta, path: "/case-studies", locale, socialCard: "work" });
}

export default async function WorkIndexPage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  const copy = COPY[locale];

  return (
    <div className="mayda-shell">
      <section className="mayda-section">
        <header className="mayda-stack" style={{ maxWidth: "44rem" }}>
          <p className="mayda-kicker">{copy.kicker}</p>
          <h1 className="mayda-display" style={{ fontSize: "clamp(2.2rem,5vw,3.8rem)" }}>
            {copy.heading[0]}
            <br />
            <span className="mayda-multiply">{copy.heading[1]}</span>
          </h1>
          <p className="mayda-lead">{copy.intro}</p>
        </header>
      </section>

      <section className="mayda-section" style={{ paddingTop: 0 }}>
        <div className="mayda-grid-2">
          {copy.cases.map((item) => (
            <Link
              key={item.id}
              href={localizePath(`/case-studies/${item.id}`, locale)}
              className="mayda-work-card"
            >
              <figure>
                <Image
                  src={item.image}
                  alt={item.alt}
                  width={1430}
                  height={894}
                  sizes="(max-width: 720px) 100vw, 46vw"
                />
              </figure>
              <div className="mayda-work-card-body">
                <div className="mayda-work-card-tags">
                  <span className="mayda-tag is-cobalt">{item.tags[0]}</span>
                  <span className="mayda-tag">{item.tags[1]}</span>
                </div>
                <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
                  {item.name}
                </h2>
                <p>{item.text}</p>
                <span className="mayda-text-link" style={{ alignSelf: "flex-start", marginTop: "0.4rem" }}>
                  {copy.open} <span aria-hidden>→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mayda-section-tight">
        <div className="mayda-card" style={{ borderColor: "var(--mint-line)" }}>
          <p className="mayda-kicker">{copy.disciplineKicker}</p>
          <p className="mayda-body" style={{ maxWidth: "48rem" }}>
            {copy.discipline}
          </p>
        </div>
      </section>

      <section className="mayda-final-cta">
        <h2 className="mayda-heading">{copy.ctaHeading}</h2>
        <div className="mayda-hero-actions" style={{ justifyContent: "center" }}>
          <Link href={localizePath("/start", locale)} className="mayda-button">
            {copy.mapCta} <span aria-hidden>→</span>
          </Link>
          <Link href={localizePath("/contact", locale)} className="mayda-button mayda-button-outline">
            {copy.talkCta}
          </Link>
        </div>
      </section>
    </div>
  );
}
