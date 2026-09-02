import Image from "next/image";
import Link from "next/link";
import { FieldFigure } from "@/components/FieldFigure";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { createPageMetadata } from "@/lib/metadata";

const COPY = {
  en: {
    meta: {
      title: "MaydaLabs — Build and acceleration company",
      socialTitle: "Build the next version of your business · MaydaLabs",
      description:
        "MaydaLabs is a build and acceleration company for founder-led businesses. Launch an idea, accelerate what already works, or remove the systems slowing you down.",
    },
    availability: "Open for new work",
    kicker: "Build and acceleration company",
    hero: ["Build the next version", "of your business."],
    lead: "Launch an idea, accelerate what already works, or remove the systems slowing you down. MaydaLabs combines product engineering, automation, lifecycle growth, and security to create leverage.",
    mapCta: "Map my next move",
    seeWork: "See the work",
    situationsKicker: "Where founders start",
    situationsHeading: "Three situations. One question: what multiplies?",
    situations: [
      ["Launch", "You have an idea that needs to become a working product.", "From a rough concept to a product real people can use — scoped around the smallest release that proves the business."],
      ["Accelerate", "You have a company or product that needs to grow or improve.", "Find the constraint holding the numbers back, then build the product, funnel, and lifecycle systems that move them."],
      ["Remove the drag", "Your workflows, systems, or operations are quietly expensive.", "Replace manual work, brittle tools, and disconnected systems with automation you can trust and inspect."],
    ],
    situationsLink: "Start with the Multiplier Map",
    proofKicker: "Verifiable proof",
    proofHeading: "Real products you can open right now.",
    proofLead: "No mockups presented as outcomes. The strongest proof is running in production with real users — and clearly labelled by who owns it.",
    proofItems: [
      ["hodlstay.com", "Client build · Live", "https://hodlstay.com"],
      ["satoshigazette.org", "Owned publication · Live", "https://satoshigazette.org"],
    ],
    leverageKicker: "How leverage is created",
    leverageHeading: "One input, several connected outputs.",
    leverage: [
      ["01", "Find the constraint", "Every business has one system holding the rest back. We name it precisely before building anything."],
      ["02", "Build the multiplier", "Design and ship the product, automation, or growth system that addresses that constraint directly."],
      ["03", "Connect it", "A system creates leverage when it feeds the others — product into measurement, measurement into lifecycle, lifecycle into revenue."],
      ["04", "Compound", "Repeat with the next constraint. Each cycle builds on verified evidence, not activity."],
    ],
    capabilitiesKicker: "Four capabilities, one system",
    capabilitiesHeading: "Everything needed to move a founder-led business.",
    capabilities: [
      ["Product Engineering", "Frontend, backend, APIs, data systems, and complete digital products — including onchain products where the business case genuinely requires them."],
      ["Automation and AI", "Workflow automation, internal tools, operational systems, integrations, and carefully scoped AI that stays inspectable."],
      ["Lifecycle and Growth", "Activation, conversion, retention, analytics, customer journeys, and the lifecycle systems that make growth repeatable."],
      ["Security and Reliability", "Security foundations, performance, resilience, access control, and the operational confidence to move fast without breaking trust."],
    ],
    mapBandKicker: "Free diagnostic",
    mapBandHeading: "Not sure which move multiplies?",
    mapBandLead: "The Multiplier Map is a five-question diagnostic with transparent rules. It gives you a concrete next-step map in about two minutes — before any conversation, account, or commitment.",
    workKicker: "Selected work",
    workHeading: "Built by MaydaLabs.",
    work: [
      {
        href: "/case-studies/hodlstay",
        image: "/work/hodlstay-2026-08-home.jpg",
        alt: "HodlStay global booking marketplace homepage",
        tags: ["Client build", "Live"],
        title: "HodlStay",
        text: "A Bitcoin-native travel idea rebuilt into a global stay marketplace — discovery, host operations, availability, payments, and migration as one system.",
      },
      {
        href: "/case-studies/satoshi-gazette",
        image: "/work/satoshi-gazette-2026-08-home.jpg",
        alt: "Satoshi Gazette publication homepage",
        tags: ["Owned publication", "Live"],
        title: "Satoshi Gazette",
        text: "An independent Bitcoin publication built and operated as a product: editorial surfaces, data systems, and a guarded publishing pipeline.",
      },
    ],
    allWork: "All work",
    ctaKicker: "Ready when you are",
    ctaHeading: ["Bring the constraint.", "We’ll build what multiplies."],
    ctaStart: "Map my next move",
    ctaTalk: "Start a conversation",
  },
  tr: {
    meta: {
      title: "MaydaLabs — İnşa ve hızlandırma şirketi",
      socialTitle: "İşinizin bir sonraki sürümünü inşa edin · MaydaLabs",
      description:
        "MaydaLabs, kurucu liderliğindeki işletmeler için bir inşa ve hızlandırma şirketidir. Bir fikri hayata geçirin, işleyeni hızlandırın veya sizi yavaşlatan sistemleri kaldırın.",
    },
    availability: "Yeni işlere açık",
    kicker: "İnşa ve hızlandırma şirketi",
    hero: ["İşinizin bir sonraki", "sürümünü inşa edin."],
    lead: "Bir fikri hayata geçirin, işleyeni hızlandırın veya sizi yavaşlatan sistemleri ortadan kaldırın. MaydaLabs; ürün mühendisliği, otomasyon, yaşam döngüsü büyümesi ve güvenliği kaldıraç yaratmak için birleştirir.",
    mapCta: "Sonraki hamlemi haritala",
    seeWork: "Projeleri gör",
    situationsKicker: "Kurucular nereden başlar",
    situationsHeading: "Üç durum. Tek soru: neyi çarpan yapar?",
    situations: [
      ["Hayata geçir", "Çalışan bir ürüne dönüşmesi gereken bir fikriniz var.", "Ham bir konseptten gerçek insanların kullanabileceği ürüne — işi kanıtlayan en küçük sürüm etrafında kapsamlandırılır."],
      ["Hızlandır", "Büyümesi veya gelişmesi gereken bir şirketiniz ya da ürününüz var.", "Rakamları tutan kısıtı bulur, ardından onları hareket ettiren ürün, huni ve yaşam döngüsü sistemlerini kurarız."],
      ["Sürtünmeyi kaldır", "İş akışlarınız, sistemleriniz veya operasyonlarınız sessizce pahalı.", "Manuel işi, kırılgan araçları ve kopuk sistemleri güvenebileceğiniz ve denetleyebileceğiniz otomasyonla değiştirin."],
    ],
    situationsLink: "Multiplier Map ile başlayın",
    proofKicker: "Doğrulanabilir kanıt",
    proofHeading: "Şu anda açabileceğiniz gerçek ürünler.",
    proofLead: "Sonuç gibi sunulan mockup yok. En güçlü kanıt, gerçek kullanıcılarla üretimde çalışıyor — ve sahibi açıkça etiketli.",
    proofItems: [
      ["hodlstay.com", "Müşteri ürünü · Canlı", "https://hodlstay.com"],
      ["satoshigazette.org", "Sahip olunan yayın · Canlı", "https://satoshigazette.org"],
    ],
    leverageKicker: "Kaldıraç nasıl yaratılır",
    leverageHeading: "Tek girdi, birbirine bağlı birden çok çıktı.",
    leverage: [
      ["01", "Kısıtı bul", "Her işte diğerlerini tutan tek bir sistem vardır. Bir şey inşa etmeden önce onu net biçimde adlandırırız."],
      ["02", "Çarpanı inşa et", "O kısıtı doğrudan ele alan ürünü, otomasyonu veya büyüme sistemini tasarlayıp yayınlarız."],
      ["03", "Bağla", "Bir sistem diğerlerini beslediğinde kaldıraç yaratır — ürün ölçüme, ölçüm yaşam döngüsüne, yaşam döngüsü gelire."],
      ["04", "Katla", "Sıradaki kısıtla tekrarla. Her döngü aktiviteye değil, doğrulanmış kanıta dayanır."],
    ],
    capabilitiesKicker: "Dört yetkinlik, tek sistem",
    capabilitiesHeading: "Kurucu liderliğindeki bir işi hareket ettirmek için gereken her şey.",
    capabilities: [
      ["Ürün Mühendisliği", "Frontend, backend, API'ler, veri sistemleri ve eksiksiz dijital ürünler — iş gerekçesi gerçekten gerektirdiğinde onchain ürünler dahil."],
      ["Otomasyon ve Yapay Zekâ", "İş akışı otomasyonu, iç araçlar, operasyon sistemleri, entegrasyonlar ve denetlenebilir kalan, dikkatle kapsamlanmış yapay zekâ."],
      ["Yaşam Döngüsü ve Büyüme", "Aktivasyon, dönüşüm, elde tutma, analitik, müşteri yolculukları ve büyümeyi tekrarlanabilir kılan yaşam döngüsü sistemleri."],
      ["Güvenlik ve Güvenilirlik", "Güvenlik temelleri, performans, dayanıklılık, erişim kontrolü ve güveni bozmadan hızlı hareket etme rahatlığı."],
    ],
    mapBandKicker: "Ücretsiz tanı",
    mapBandHeading: "Hangi hamlenin çarpan olduğundan emin değil misiniz?",
    mapBandLead: "Multiplier Map, kuralları şeffaf beş soruluk bir tanıdır. Herhangi bir görüşme, hesap veya taahhütten önce, yaklaşık iki dakikada somut bir sonraki adım haritası verir.",
    workKicker: "Seçili işler",
    workHeading: "MaydaLabs imzalı.",
    work: [
      {
        href: "/case-studies/hodlstay",
        image: "/work/hodlstay-2026-08-home.jpg",
        alt: "HodlStay küresel rezervasyon pazarı ana sayfası",
        tags: ["Müşteri ürünü", "Canlı"],
        title: "HodlStay",
        text: "Bitcoin-native bir seyahat fikri küresel konaklama pazarına dönüştürüldü — keşif, ev sahibi operasyonları, uygunluk, ödemeler ve veri göçü tek sistem olarak.",
      },
      {
        href: "/case-studies/satoshi-gazette",
        image: "/work/satoshi-gazette-2026-08-home.jpg",
        alt: "Satoshi Gazette yayın ana sayfası",
        tags: ["Sahip olunan yayın", "Canlı"],
        title: "Satoshi Gazette",
        text: "Ürün olarak inşa edilip işletilen bağımsız bir Bitcoin yayını: editoryal yüzeyler, veri sistemleri ve korumalı bir yayınlama hattı.",
      },
    ],
    allWork: "Tüm işler",
    ctaKicker: "Siz hazır olduğunuzda",
    ctaHeading: ["Kısıtı getirin.", "Çarpan olanı inşa edelim."],
    ctaStart: "Sonraki hamlemi haritala",
    ctaTalk: "Bir görüşme başlat",
  },
  fr: {
    meta: {
      title: "MaydaLabs — Entreprise de construction et d’accélération",
      socialTitle: "Construisez la prochaine version de votre entreprise · MaydaLabs",
      description:
        "MaydaLabs est une entreprise de construction et d’accélération pour les entreprises dirigées par leurs fondateurs. Lancez une idée, accélérez ce qui fonctionne ou éliminez les systèmes qui vous freinent.",
    },
    availability: "Ouvert à de nouveaux projets",
    kicker: "Construction et accélération",
    hero: ["Construisez la prochaine", "version de votre entreprise."],
    lead: "Lancez une idée, accélérez ce qui fonctionne déjà ou éliminez les systèmes qui vous ralentissent. MaydaLabs combine ingénierie produit, automatisation, croissance lifecycle et sécurité pour créer du levier.",
    mapCta: "Cartographier ma prochaine étape",
    seeWork: "Voir les réalisations",
    situationsKicker: "Où commencent les fondateurs",
    situationsHeading: "Trois situations. Une question : qu’est-ce qui multiplie ?",
    situations: [
      ["Lancer", "Vous avez une idée qui doit devenir un produit fonctionnel.", "D’un concept brut à un produit utilisable par de vraies personnes — cadré autour de la plus petite version qui prouve le business."],
      ["Accélérer", "Vous avez une entreprise ou un produit qui doit croître ou s’améliorer.", "Identifier la contrainte qui retient les chiffres, puis construire le produit, le funnel et les systèmes lifecycle qui les font bouger."],
      ["Éliminer la friction", "Vos workflows, systèmes ou opérations coûtent cher en silence.", "Remplacer le travail manuel, les outils fragiles et les systèmes déconnectés par une automatisation fiable et inspectable."],
    ],
    situationsLink: "Commencer par la Multiplier Map",
    proofKicker: "Preuves vérifiables",
    proofHeading: "De vrais produits que vous pouvez ouvrir maintenant.",
    proofLead: "Pas de mockups présentés comme des résultats. La preuve la plus forte tourne en production avec de vrais utilisateurs — et son propriétaire est clairement indiqué.",
    proofItems: [
      ["hodlstay.com", "Produit client · En ligne", "https://hodlstay.com"],
      ["satoshigazette.org", "Publication détenue · En ligne", "https://satoshigazette.org"],
    ],
    leverageKicker: "Comment le levier se crée",
    leverageHeading: "Une entrée, plusieurs sorties connectées.",
    leverage: [
      ["01", "Trouver la contrainte", "Chaque entreprise a un système qui retient les autres. Nous le nommons précisément avant de construire quoi que ce soit."],
      ["02", "Construire le multiplicateur", "Concevoir et livrer le produit, l’automatisation ou le système de croissance qui traite cette contrainte directement."],
      ["03", "Le connecter", "Un système crée du levier quand il alimente les autres — le produit nourrit la mesure, la mesure le lifecycle, le lifecycle le revenu."],
      ["04", "Composer", "Répéter avec la contrainte suivante. Chaque cycle s’appuie sur des preuves vérifiées, pas sur de l’activité."],
    ],
    capabilitiesKicker: "Quatre capacités, un système",
    capabilitiesHeading: "Tout ce qu’il faut pour faire bouger une entreprise de fondateur.",
    capabilities: [
      ["Ingénierie produit", "Frontend, backend, API, systèmes de données et produits numériques complets — y compris des produits onchain quand le cas d’affaires l’exige vraiment."],
      ["Automatisation et IA", "Automatisation des workflows, outils internes, systèmes opérationnels, intégrations et IA soigneusement cadrée, qui reste inspectable."],
      ["Lifecycle et croissance", "Activation, conversion, rétention, analytics, parcours clients et systèmes lifecycle qui rendent la croissance répétable."],
      ["Sécurité et fiabilité", "Fondations de sécurité, performance, résilience, contrôle d’accès et la confiance opérationnelle pour avancer vite sans casser la confiance."],
    ],
    mapBandKicker: "Diagnostic gratuit",
    mapBandHeading: "Pas sûr du mouvement qui multiplie ?",
    mapBandLead: "La Multiplier Map est un diagnostic en cinq questions aux règles transparentes. Elle vous donne une feuille de route concrète en deux minutes — avant tout échange, compte ou engagement.",
    workKicker: "Réalisations sélectionnées",
    workHeading: "Construit par MaydaLabs.",
    work: [
      {
        href: "/case-studies/hodlstay",
        image: "/work/hodlstay-2026-08-home.jpg",
        alt: "Page d’accueil de la marketplace mondiale HodlStay",
        tags: ["Produit client", "En ligne"],
        title: "HodlStay",
        text: "Une idée de voyage Bitcoin-native reconstruite en marketplace mondiale de séjours — découverte, opérations hôtes, disponibilité, paiements et migration en un seul système.",
      },
      {
        href: "/case-studies/satoshi-gazette",
        image: "/work/satoshi-gazette-2026-08-home.jpg",
        alt: "Page d’accueil de la publication Satoshi Gazette",
        tags: ["Publication détenue", "En ligne"],
        title: "Satoshi Gazette",
        text: "Une publication Bitcoin indépendante construite et opérée comme un produit : surfaces éditoriales, systèmes de données et pipeline de publication contrôlé.",
      },
    ],
    allWork: "Toutes les réalisations",
    ctaKicker: "Prêt quand vous l’êtes",
    ctaHeading: ["Apportez la contrainte.", "Nous construirons ce qui multiplie."],
    ctaStart: "Cartographier ma prochaine étape",
    ctaTalk: "Démarrer un échange",
  },
} as const;

export async function generateMetadata({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  return createPageMetadata({ ...COPY[locale].meta, path: "/", locale, socialCard: "studio" });
}

export default async function HomePage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  const copy = COPY[locale];

  return (
    <div>
      <section className="mayda-hero">
        <div className="mayda-shell mayda-hero-grid">
          <div className="mayda-stack-lg">
            <div className="mayda-stack" style={{ gap: "1.2rem" }}>
              <div className="mayda-availability">
                <span /> {copy.availability}
              </div>
              <p className="mayda-kicker" style={{ margin: 0 }}>{copy.kicker}</p>
              <h1 className="mayda-display">
                {copy.hero[0]}
                <br />
                <span className="mayda-multiply">{copy.hero[1]}</span>
              </h1>
              <p className="mayda-lead">{copy.lead}</p>
            </div>
            <div className="mayda-hero-actions">
              <Link href={localizePath("/start", locale)} className="mayda-button">
                {copy.mapCta} <span aria-hidden>→</span>
              </Link>
              <Link href={localizePath("/case-studies", locale)} className="mayda-button mayda-button-outline">
                {copy.seeWork}
              </Link>
            </div>
          </div>
          <FieldFigure className="hidden md:block" />
        </div>
      </section>

      <section className="mayda-section" style={{ paddingTop: 0 }}>
        <div className="mayda-shell mayda-stack-lg">
          <header>
            <p className="mayda-kicker">{copy.situationsKicker}</p>
            <h2 className="mayda-heading">{copy.situationsHeading}</h2>
          </header>
          <div className="mayda-situations">
            {copy.situations.map(([title, lead, detail]) => (
              <article key={title} className="mayda-situation">
                <h3>{title}</h3>
                <p style={{ color: "var(--frost)" }}>{lead}</p>
                <p>{detail}</p>
                <Link href={localizePath("/start", locale)} className="mayda-text-link">
                  {copy.situationsLink} <span aria-hidden>→</span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mayda-section-tight">
        <div className="mayda-shell mayda-stack">
          <header>
            <p className="mayda-kicker">{copy.proofKicker}</p>
            <h2 className="mayda-heading">{copy.proofHeading}</h2>
            <p className="mayda-body mt-4">{copy.proofLead}</p>
          </header>
          <div className="mayda-proof-strip" role="list">
            {copy.proofItems.map(([host, label, url]) => (
              <a key={host} role="listitem" href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                <strong>{host} ↗</strong>
                <span>{label}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="mayda-section">
        <div className="mayda-shell mayda-stack-lg">
          <header>
            <p className="mayda-kicker">{copy.leverageKicker}</p>
            <h2 className="mayda-heading">{copy.leverageHeading}</h2>
          </header>
          <div className="mayda-grid-2">
            {copy.leverage.map(([number, title, text]) => (
              <article key={number} className="mayda-card">
                <p className="mayda-card-number">{number}</p>
                <h3 className="mayda-subheading mt-2">{title}</h3>
                <p className="mayda-body mt-3">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mayda-section" style={{ paddingTop: 0 }}>
        <div className="mayda-shell mayda-stack-lg">
          <header>
            <p className="mayda-kicker">{copy.capabilitiesKicker}</p>
            <h2 className="mayda-heading">{copy.capabilitiesHeading}</h2>
          </header>
          <div className="mayda-grid-2">
            {copy.capabilities.map(([title, text]) => (
              <article key={title} className="mayda-card">
                <h3 className="mayda-subheading">{title}</h3>
                <p className="mayda-body mt-3">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mayda-section-tight">
        <div className="mayda-shell">
          <div className="mayda-card is-link" style={{ borderColor: "var(--cobalt-line)" }}>
            <div className="mayda-hero-grid" style={{ alignItems: "center" }}>
              <div className="mayda-stack">
                <p className="mayda-kicker" style={{ margin: 0 }}>{copy.mapBandKicker}</p>
                <h2 className="mayda-heading">{copy.mapBandHeading}</h2>
                <p className="mayda-body">{copy.mapBandLead}</p>
                <div>
                  <Link href={localizePath("/start", locale)} className="mayda-button">
                    {copy.mapCta} <span aria-hidden>→</span>
                  </Link>
                </div>
              </div>
              <FieldFigure className="hidden lg:block" />
            </div>
          </div>
        </div>
      </section>

      <section className="mayda-section">
        <div className="mayda-shell mayda-stack-lg">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mayda-kicker">{copy.workKicker}</p>
              <h2 className="mayda-heading">{copy.workHeading}</h2>
            </div>
            <Link href={localizePath("/case-studies", locale)} className="mayda-text-link">
              {copy.allWork} <span aria-hidden>→</span>
            </Link>
          </header>
          <div className="mayda-grid-2">
            {copy.work.map((item) => (
              <Link key={item.href} href={localizePath(item.href, locale)} className="mayda-work-card">
                <figure>
                  <Image src={item.image} alt={item.alt} width={1430} height={894} sizes="(max-width: 720px) 100vw, 46vw" />
                </figure>
                <div className="mayda-work-card-body">
                  <div className="mayda-work-card-tags">
                    {item.tags.map((tag, index) => (
                      <span key={tag} className={`mayda-tag ${index === 0 ? "is-cobalt" : "is-mint"}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mayda-final-cta mayda-shell">
        <div className="mayda-availability">
          <span /> {copy.availability}
        </div>
        <p className="mayda-kicker" style={{ margin: 0 }}>{copy.ctaKicker}</p>
        <h2 className="mayda-display" style={{ fontSize: "clamp(2rem,5vw,3.6rem)" }}>
          {copy.ctaHeading[0]}
          <br />
          <span className="mayda-multiply">{copy.ctaHeading[1]}</span>
        </h2>
        <div className="mayda-hero-actions" style={{ justifyContent: "center" }}>
          <Link href={localizePath("/start", locale)} className="mayda-button">
            {copy.ctaStart} <span aria-hidden>→</span>
          </Link>
          <Link href={localizePath("/contact", locale)} className="mayda-button mayda-button-outline">
            {copy.ctaTalk}
          </Link>
        </div>
      </section>
    </div>
  );
}
