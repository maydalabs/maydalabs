import Link from "next/link";
import { BuildDossier } from "@/components/BuildDossier";
import { HomeExperience } from "@/components/HomeExperience";
import { InProgressVisual } from "@/components/InProgressVisual";
import { ProjectPreview } from "@/components/ProjectPreview";
import { ServiceRouter } from "@/components/ServiceRouter";
import { SignalField } from "@/components/SignalField";
import { type Locale, localizePath } from "@/lib/i18n";
import { getIntroCallUrl } from "@/lib/marketingLinks";

const HOME_COPY = {
  en: {
    eyebrow: "Product & growth studio · Istanbul / Everywhere",
    hero: ["We build software", "people can", "feel."],
    heroCopy: "Apps, marketplaces, commerce, and the growth systems around them. Built for founders with ambitious ideas and no patience for agency theatre.",
    start: "Start a project",
    explore: "Explore our work",
    index: "DESIGN · CODE · GROWTH",
    manifesto: ["Bitcoin-native by proof.", "Founder-focused by design.", "We work across industries."],
    profile: {
      kicker: "For hiring teams",
      name: "Mehmet E. Mayda",
      role: "Founder · Full-stack product builder · Growth systems",
      copy: "See the individual ownership, working range, and inspectable project evidence behind MaydaLabs.",
      action: "View founder profile",
    },
    workKicker: "Selected work / 001–004",
    workTitle: "Proof, not promises.",
    workIntro: "Two products are live in public. Two more are being built in private. Together they show the range from marketplaces and media systems to trust-critical product architecture.",
    projects: {
      hodl: {
        category: "Marketplace · Travel · Bitcoin",
        label: "A stay worth holding onto",
        title: "Turning a Bitcoin travel idea into a global booking product.",
        copy: "Product strategy, marketplace architecture, host and guest journeys, booking operations, payments, brand evolution, and launch systems in one connected build.",
        tags: ["Product", "UX/UI", "Next.js", "Supabase", "Bitcoin payments"],
        story: "View project story",
        live: "Visit live",
        status: "Client project · Live",
        alt: "HodlStay marketplace homepage",
      },
      gazette: {
        category: "Media · Data · AI-assisted ops",
        label: "Signal for Bitcoin operators",
        title: "Building a newsroom as a product, not just a publication.",
        copy: "An editorial system that connects live market context, structured desks, publishing workflows, briefings, and AI-assisted operations without losing human judgment.",
        tags: ["Editorial UX", "Data systems", "Automation", "CMS", "AI workflows"],
        story: "View project story",
        live: "Visit live",
        status: "Live · Active build",
        alt: "Satoshi Gazette Bitcoin newsroom homepage",
      },
    },
    development: {
      kicker: "In the lab / Private working products",
      title: "Show the work. Label the frontier.",
      intro: "These products are not launch claims. They are active builds presented with their current evidence, constraints, and next gates intact.",
      story: "View work-in-progress case",
      items: [
        { variant: "mortal", number: "03", name: "Mortal Vault", status: "Private alpha · Unaudited", title: "A self-custodial continuity vault with delayed claims and an owner challenge window.", copy: "Solidity contracts, owner and beneficiary journeys, event-backed history, security tests, and explicit release gates—without pretending an unaudited alpha is ready for meaningful funds.", tags: ["Solidity", "Hardhat", "Next.js", "Security"], path: "/case-studies/mortal-vault" },
        { variant: "sofra", number: "04", name: "Sofra", status: "Private Phase 1", title: "A managed household dinner marketplace built around trust, privacy, and the rhythm of a shared table.", copy: "Bilingual guest, host, and operator journeys with public/private data boundaries and demo-safe infrastructure—without claiming a public launch or real payments.", tags: ["Marketplace", "Next.js", "Supabase", "EN/TR"], path: "/case-studies/sofra" },
      ],
    },
    servicesKicker: "What we build / Three connected layers",
    servicesTitle: "From first click to working business.",
    servicesIntro: "You do not need five disconnected vendors. We connect the product, the experience, and the system that brings people back.",
    approachKicker: "How we work / No black box",
    approachTitle: "Momentum is the method.",
    approachIntro: "Every engagement is scoped after a conversation. The shape changes; the operating rhythm does not.",
    process: [
      ["01", "Find the signal", "We turn the messy brief into a crisp product and commercial target."],
      ["02", "Shape the system", "Flows, architecture, visual language, and priorities become one build plan."],
      ["03", "Ship in public", "Working software arrives in tight cycles, with decisions made against the real thing."],
      ["04", "Create momentum", "We instrument, launch, learn, and build the next highest-leverage move."],
    ],
    availability: "Open for new client work",
    ctaKicker: "Have something ambitious in mind?",
    cta: ["Bring the messy idea.", "We’ll find the signal."],
    book: "Book a project call",
    email: "Email the brief",
    note: "No fixed packages. We scope the right engagement after we understand the job.",
  },
  tr: {
    eyebrow: "Ürün ve büyüme stüdyosu · İstanbul / Her yer",
    hero: ["İnsanların hissedebileceği", "yazılımlar", "geliştiriyoruz."],
    heroCopy: "Uygulamalar, pazar yerleri, e-ticaret ve bunların etrafındaki büyüme sistemleri. İddialı fikirleri olan ve ajans tiyatrosuna sabrı olmayan kurucular için.",
    start: "Proje başlat",
    explore: "Projelerimizi keşfet",
    index: "TASARIM · KOD · BÜYÜME",
    manifesto: ["Kanıtımız Bitcoin-native projeler.", "Odağımız kurucular.", "Farklı sektörlerle çalışıyoruz."],
    profile: {
      kicker: "İşe alım ekipleri için",
      name: "Mehmet E. Mayda",
      role: "Kurucu · Full-stack ürün geliştirici · Büyüme sistemleri",
      copy: "MaydaLabs'in arkasındaki bireysel sahipliği, çalışma alanını ve incelenebilir proje kanıtlarını görün.",
      action: "Kurucu profilini incele",
    },
    workKicker: "Seçili projeler / 001–004",
    workTitle: "Vaat değil, kanıt.",
    workIntro: "İki ürün herkese açık ve canlı. İki ürün daha özel olarak geliştiriliyor. Birlikte pazar yerlerinden medya sistemlerine ve güven kritik ürün mimarisine uzanan alanı gösteriyorlar.",
    projects: {
      hodl: {
        category: "Pazar yeri · Seyahat · Bitcoin",
        label: "Hodl etmeye değer bir konaklama",
        title: "Bir Bitcoin seyahat fikrini küresel bir rezervasyon ürününe dönüştürmek.",
        copy: "Ürün stratejisi, pazar yeri mimarisi, ev sahibi ve misafir yolculukları, rezervasyon operasyonları, ödemeler, marka dönüşümü ve lansman sistemleri tek bir bağlantılı üründe.",
        tags: ["Ürün", "UX/UI", "Next.js", "Supabase", "Bitcoin ödemeleri"],
        story: "Proje hikâyesini incele",
        live: "Canlı ürünü aç",
        status: "Müşteri projesi · Canlı",
        alt: "HodlStay pazar yeri ana sayfası",
      },
      gazette: {
        category: "Medya · Veri · Yapay zekâ destekli operasyon",
        label: "Bitcoin operatörleri için sinyal",
        title: "Sadece bir yayın değil, ürün olarak çalışan bir haber merkezi kurmak.",
        copy: "Canlı piyasa bağlamını, yapılandırılmış masaları, yayın akışlarını, bültenleri ve yapay zekâ destekli operasyonları insan muhakemesini kaybetmeden birleştiren editoryal sistem.",
        tags: ["Editoryal UX", "Veri sistemleri", "Otomasyon", "CMS", "Yapay zekâ akışları"],
        story: "Proje hikâyesini incele",
        live: "Canlı ürünü aç",
        status: "Canlı · Aktif geliştirme",
        alt: "Satoshi Gazette Bitcoin haber merkezi ana sayfası",
      },
    },
    development: {
      kicker: "Laboratuvarda / Özel çalışan ürünler",
      title: "Çalışmayı göster. Sınırı açıkla.",
      intro: "Bunlar lansman iddiası değil. Mevcut kanıtları, sınırları ve sonraki kapılarıyla sunulan aktif ürün geliştirmeleridir.",
      story: "Geliştirme aşaması vakasını incele",
      items: [
        { variant: "mortal", number: "03", name: "Mortal Vault", status: "Özel alpha · Denetlenmedi", title: "Gecikmeli talepler ve sahip itiraz süresi olan self-custody süreklilik kasası.", copy: "Solidity sözleşmeleri, sahip ve lehtar yolculukları, event tabanlı geçmiş, güvenlik testleri ve açık sürüm kapıları—denetlenmemiş alpha'yı anlamlı tutarlara hazır göstermeden.", tags: ["Solidity", "Hardhat", "Next.js", "Güvenlik"], path: "/case-studies/mortal-vault" },
        { variant: "sofra", number: "04", name: "Sofra", status: "Özel Phase 1", title: "Güven, gizlilik ve paylaşılan sofranın ritmi etrafında kurulan yönetilen ev yemeği pazarı.", copy: "Açık/özel veri sınırları ve demo güvenli altyapıyla iki dilli misafir, ev sahibi ve operatör yolculukları—herkese açık lansman veya gerçek ödeme iddiası olmadan.", tags: ["Pazar yeri", "Next.js", "Supabase", "EN/TR"], path: "/case-studies/sofra" },
      ],
    },
    servicesKicker: "Neler geliştiriyoruz / Birbirine bağlı üç katman",
    servicesTitle: "İlk tıklamadan çalışan işletmeye.",
    servicesIntro: "Birbirinden kopuk beş farklı tedarikçiye ihtiyacınız yok. Ürünü, deneyimi ve insanları geri getiren sistemi birbirine bağlıyoruz.",
    approachKicker: "Nasıl çalışıyoruz / Kara kutu yok",
    approachTitle: "Yöntemimiz ivme.",
    approachIntro: "Her çalışma ilk görüşmeden sonra kapsamlandırılır. Şekli değişir; çalışma ritmi değişmez.",
    process: [
      ["01", "Sinyali bul", "Dağınık brief'i net bir ürün ve ticari hedefe dönüştürüyoruz."],
      ["02", "Sistemi şekillendir", "Akışlar, mimari, görsel dil ve öncelikler tek bir geliştirme planına dönüşür."],
      ["03", "Gerçek ürünü yayınla", "Çalışan yazılım kısa döngülerde gelir; kararlar gerçek ürün üzerinden alınır."],
      ["04", "İvme yarat", "Ölçer, yayına alır, öğrenir ve en yüksek etkili bir sonraki hamleyi geliştiririz."],
    ],
    availability: "Yeni müşteri projelerine açık",
    ctaKicker: "Aklınızda iddialı bir fikir mi var?",
    cta: ["Dağınık fikri getirin.", "Sinyali birlikte bulalım."],
    book: "Proje görüşmesi ayarla",
    email: "Brief'i e-postayla gönder",
    note: "Sabit paketler yok. İşi anladıktan sonra doğru çalışma kapsamını oluşturuyoruz.",
  },
  fr: {
    eyebrow: "Studio produit et croissance · Istanbul / Partout",
    hero: ["Nous créons des logiciels", "que l’on peut", "ressentir."],
    heroCopy: "Applications, marketplaces, e-commerce et systèmes de croissance. Pour les fondateurs aux idées ambitieuses qui n’ont aucune patience pour le théâtre des agences.",
    start: "Lancer un projet",
    explore: "Découvrir nos projets",
    index: "DESIGN · CODE · CROISSANCE",
    manifesto: ["Bitcoin-native par les preuves.", "Pensé pour les fondateurs.", "Nous travaillons dans tous les secteurs."],
    profile: {
      kicker: "Pour les équipes de recrutement",
      name: "Mehmet E. Mayda",
      role: "Fondateur · Builder produit full-stack · Systèmes de croissance",
      copy: "Découvrez l’ownership individuel, le champ d’action et les preuves projet vérifiables derrière MaydaLabs.",
      action: "Voir le profil fondateur",
    },
    workKicker: "Projets sélectionnés / 001–004",
    workTitle: "Des preuves, pas des promesses.",
    workIntro: "Deux produits sont publics et en ligne. Deux autres sont construits en privé. Ensemble, ils vont des marketplaces et médias jusqu’aux architectures produit critiques.",
    projects: {
      hodl: {
        category: "Marketplace · Voyage · Bitcoin",
        label: "Un séjour qui mérite d’être conservé",
        title: "Transformer une idée de voyage Bitcoin en produit mondial de réservation.",
        copy: "Stratégie produit, architecture marketplace, parcours hôtes et voyageurs, opérations de réservation, paiements, évolution de marque et lancement dans un seul système.",
        tags: ["Produit", "UX/UI", "Next.js", "Supabase", "Paiements Bitcoin"],
        story: "Voir l’étude de cas",
        live: "Voir le produit",
        status: "Projet client · En ligne",
        alt: "Page d’accueil de la marketplace HodlStay",
      },
      gazette: {
        category: "Média · Données · Opérations assistées par IA",
        label: "Le signal pour les opérateurs Bitcoin",
        title: "Concevoir une rédaction comme un produit, pas seulement une publication.",
        copy: "Un système éditorial qui relie contexte de marché, rubriques structurées, publication, briefings et opérations assistées par IA sans sacrifier le jugement humain.",
        tags: ["UX éditoriale", "Systèmes de données", "Automatisation", "CMS", "Workflows IA"],
        story: "Voir l’étude de cas",
        live: "Voir le produit",
        status: "En ligne · Construction active",
        alt: "Page d’accueil de la rédaction Bitcoin Satoshi Gazette",
      },
    },
    development: {
      kicker: "Au laboratoire / Produits privés fonctionnels",
      title: "Montrer le travail. Nommer la frontière.",
      intro: "Ce ne sont pas des lancements. Ce sont des constructions actives présentées avec leurs preuves, contraintes et prochaines conditions.",
      story: "Voir l’étude en cours",
      items: [
        { variant: "mortal", number: "03", name: "Mortal Vault", status: "Alpha privée · Non auditée", title: "Un coffre de continuité en autogarde avec réclamation différée et délai de recours.", copy: "Contrats Solidity, parcours propriétaire et bénéficiaire, historique d’événements, tests de sécurité et conditions de sortie—sans présenter une alpha non auditée comme prête pour des fonds significatifs.", tags: ["Solidity", "Hardhat", "Next.js", "Sécurité"], path: "/case-studies/mortal-vault" },
        { variant: "sofra", number: "04", name: "Sofra", status: "Phase 1 privée", title: "Une marketplace gérée de dîners chez l’habitant fondée sur confiance, confidentialité et table partagée.", copy: "Parcours bilingues invité, hôte et opérateur, limites public/privé et infrastructure de démo sûre—sans revendiquer lancement public ou paiements réels.", tags: ["Marketplace", "Next.js", "Supabase", "EN/TR"], path: "/case-studies/sofra" },
      ],
    },
    servicesKicker: "Ce que nous construisons / Trois couches connectées",
    servicesTitle: "Du premier clic à une activité qui fonctionne.",
    servicesIntro: "Vous n’avez pas besoin de cinq prestataires isolés. Nous relions le produit, l’expérience et le système qui fait revenir les utilisateurs.",
    approachKicker: "Notre méthode / Aucune boîte noire",
    approachTitle: "L’élan est la méthode.",
    approachIntro: "Chaque mission est cadrée après un échange. La forme change, pas le rythme de travail.",
    process: [
      ["01", "Trouver le signal", "Nous transformons un brief encore flou en objectif produit et commercial précis."],
      ["02", "Structurer le système", "Parcours, architecture, langage visuel et priorités deviennent un plan de construction unique."],
      ["03", "Livrer au grand jour", "Le logiciel fonctionnel arrive par cycles courts et les décisions se prennent sur le produit réel."],
      ["04", "Créer l’élan", "Nous instrumentons, lançons, apprenons puis construisons l’étape suivante à plus fort impact."],
    ],
    availability: "Ouvert à de nouveaux projets clients",
    ctaKicker: "Vous avez une idée ambitieuse ?",
    cta: ["Apportez l’idée encore floue.", "Nous trouverons le signal."],
    book: "Réserver un appel projet",
    email: "Envoyer le brief",
    note: "Pas de forfaits fixes. Nous définissons la bonne mission après avoir compris le travail.",
  },
} as const;

function ArrowUpRight() {
  return <span aria-hidden className="text-[0.9em]">↗</span>;
}

export function StudioHome({ locale }: { locale: Locale }) {
  const copy = HOME_COPY[locale];
  const projectUrl = getIntroCallUrl("home_hero");

  return (
    <HomeExperience>
      <section className="studio-hero">
        <div className="studio-hero-copy">
          <div className="studio-eyebrow hero-reveal hero-reveal-1">
            <span className="studio-status-dot" />
            {copy.eyebrow}
          </div>

          <h1 className="hero-reveal hero-reveal-2">
            {copy.hero[0]}<br />{copy.hero[1]} <em>{copy.hero[2]}</em>
          </h1>

          <p className="hero-reveal hero-reveal-3">{copy.heroCopy}</p>

          <div className="hero-reveal hero-reveal-4 flex flex-col gap-3 sm:flex-row">
            <Link href={projectUrl} target="_blank" rel="noopener noreferrer" className="studio-button">
              {copy.start} <ArrowUpRight />
            </Link>
            <Link href={localizePath("/#work", locale)} className="studio-button studio-button-ghost">
              {copy.explore} <span aria-hidden>↓</span>
            </Link>
          </div>
        </div>

        <div className="hero-reveal hero-reveal-3 studio-hero-visual">
          <SignalField locale={locale} />
        </div>

        <div className="studio-hero-index" aria-hidden="true">
          <span>ML / 2026</span><span>{copy.index}</span>
        </div>
      </section>

      <section className="studio-manifesto" aria-label="Positioning" data-reveal>
        <p>{copy.manifesto[0]}</p><p>{copy.manifesto[1]}</p>
        <div className="studio-manifesto-line" /><span>{copy.manifesto[2]}</span>
      </section>

      <aside className="studio-founder-gateway" data-reveal>
        <div>
          <p className="studio-kicker">{copy.profile.kicker}</p>
          <h2>{copy.profile.name}</h2>
          <span>{copy.profile.role}</span>
        </div>
        <p>{copy.profile.copy}</p>
        <Link href={localizePath("/profile", locale)} className="studio-text-link">
          {copy.profile.action} <ArrowUpRight />
        </Link>
      </aside>

      <section id="work" className="studio-section scroll-mt-28">
        <div className="studio-section-heading" data-reveal>
          <div><p className="studio-kicker">{copy.workKicker}</p><h2>{copy.workTitle}</h2></div>
          <p>{copy.workIntro}</p>
        </div>

        <article className="project-case project-case-hodl">
          <div className="project-case-copy">
            <div className="project-case-topline"><span>01 / HodlStay</span><span>{copy.projects.hodl.category}</span></div>
            <div>
              <p className="project-case-label">{copy.projects.hodl.label}</p>
              <h3>{copy.projects.hodl.title}</h3>
              <p className="project-case-description">{copy.projects.hodl.copy}</p>
            </div>
            <div className="project-case-tags">{copy.projects.hodl.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            <div className="project-case-links">
              <Link href={localizePath("/case-studies/hodlstay", locale)} className="studio-text-link">{copy.projects.hodl.story} <ArrowUpRight /></Link>
              <a href="https://hodlstay.com" target="_blank" rel="noopener noreferrer" className="studio-text-link studio-text-link-muted">{copy.projects.hodl.live} <ArrowUpRight /></a>
            </div>
          </div>

          <ProjectPreview locale={locale} variant="hodl" domain="hodlstay.com" status={copy.projects.hodl.status} imageSrc="/work/hodlstay-2026-08-home.png" imageAlt={copy.projects.hodl.alt} imageWidth={1430} imageHeight={894} watermarkSrc="/work/hodlstay-logo.png" watermarkWidth={6865} watermarkHeight={1255} watermarkClassName="project-watermark-wide" />
        </article>

        <article className="project-case project-case-gazette">
          <div className="project-case-copy">
            <div className="project-case-topline"><span>02 / Satoshi Gazette</span><span>{copy.projects.gazette.category}</span></div>
            <div>
              <p className="project-case-label">{copy.projects.gazette.label}</p>
              <h3>{copy.projects.gazette.title}</h3>
              <p className="project-case-description">{copy.projects.gazette.copy}</p>
            </div>
            <div className="project-case-tags">{copy.projects.gazette.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            <div className="project-case-links">
              <Link href={localizePath("/case-studies/satoshi-gazette", locale)} className="studio-text-link">{copy.projects.gazette.story} <ArrowUpRight /></Link>
              <a href="https://satoshigazette.org" target="_blank" rel="noopener noreferrer" className="studio-text-link studio-text-link-muted">{copy.projects.gazette.live} <ArrowUpRight /></a>
            </div>
          </div>

          <ProjectPreview locale={locale} variant="gazette" domain="satoshigazette.org" status={copy.projects.gazette.status} imageSrc="/work/satoshi-gazette-2026-08-home.png" imageAlt={copy.projects.gazette.alt} imageWidth={1280} imageHeight={720} watermarkSrc="/work/satoshi-gazette-ec1-mark.svg" watermarkWidth={64} watermarkHeight={64} watermarkClassName="project-watermark-mark" />
        </article>

        <div id="in-development" className="lab-work-heading scroll-mt-28" data-reveal>
          <div><p className="studio-kicker">{copy.development.kicker}</p><h3>{copy.development.title}</h3></div>
          <p>{copy.development.intro}</p>
        </div>

        <div className="lab-project-grid">
          {copy.development.items.map((item) => (
            <article id={`${item.variant}-preview`} className="lab-project-card scroll-mt-28" key={item.name} data-reveal>
              <header><span>{item.number} / {item.name}</span><span>{item.status}</span></header>
              <InProgressVisual compact locale={locale} variant={item.variant} />
              <div className="lab-project-card-copy">
                <h4>{item.title}</h4>
                <p>{item.copy}</p>
                <div className="project-case-tags">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                <Link href={localizePath(item.path, locale)} className="studio-text-link">{copy.development.story} <ArrowUpRight /></Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="services" className="studio-section studio-services scroll-mt-28">
        <div className="studio-section-heading" data-reveal>
          <div><p className="studio-kicker">{copy.servicesKicker}</p><h2>{copy.servicesTitle}</h2></div>
          <p>{copy.servicesIntro}</p>
        </div>
        <ServiceRouter locale={locale} />
      </section>

      <BuildDossier locale={locale} />

      <section id="approach" className="studio-section scroll-mt-28">
        <div className="studio-section-heading" data-reveal>
          <div><p className="studio-kicker">{copy.approachKicker}</p><h2>{copy.approachTitle}</h2></div>
          <p>{copy.approachIntro}</p>
        </div>
        <div className="studio-process-grid">
          {copy.process.map(([number, title, description]) => (
            <article key={number} data-reveal><span>{number}</span><div><h3>{title}</h3><p>{description}</p></div></article>
          ))}
        </div>
      </section>

      <section className="studio-final-cta" data-reveal>
        <div className="studio-availability"><span /> {copy.availability}</div>
        <p className="studio-kicker">{copy.ctaKicker}</p>
        <h2>{copy.cta[0]}<br /><em>{copy.cta[1]}</em></h2>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={getIntroCallUrl("home_bottom")} target="_blank" rel="noopener noreferrer" className="studio-button studio-button-light">{copy.book} <ArrowUpRight /></Link>
          <a href="mailto:info@maydalabs.com" className="studio-button studio-button-outline-light">{copy.email}</a>
        </div>
        <p className="studio-final-note">{copy.note}</p>
      </section>
    </HomeExperience>
  );
}
