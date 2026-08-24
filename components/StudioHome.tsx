import Link from "next/link";
import { BuildDossier } from "@/components/BuildDossier";
import { HomeExperience } from "@/components/HomeExperience";
import { ProductConstellation } from "@/components/ProductConstellation";
import { ServiceRouter } from "@/components/ServiceRouter";
import { VisualProofReel } from "@/components/VisualProofReel";
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
    workIntro: "Two products are live in public. Two more are active private builds, shown with their boundaries intact.",
    workCta: "Explore all case studies",
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
    evidence: {
      kicker: "This site is evidence / Measured, not promised",
      note: "The studio site ships to the same standard we sell. Metrics from Lighthouse and production, August 2026.",
      items: [
        ["100·100·100", "Accessibility · SEO · best practices"],
        ["430 KB", "First-load transfer, home"],
        ["43 ms", "Server response, edge"],
        ["3", "Languages shipped end-to-end"],
        ["0.00", "Cumulative layout shift"],
      ],
    },
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
    workIntro: "İki ürün herkese açık ve canlı. İki aktif özel geliştirme ise sınırları korunarak gösteriliyor.",
    workCta: "Tüm vaka çalışmalarını incele",
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
    evidence: {
      kicker: "Bu site kanıtın kendisi / Vaat değil, ölçüm",
      note: "Stüdyo sitesi, sattığımız standardın aynısıyla yayında. Metrikler Lighthouse ve üretim ortamından, Ağustos 2026.",
      items: [
        ["100·100·100", "Erişilebilirlik · SEO · en iyi uygulamalar"],
        ["430 KB", "Ana sayfa ilk yükleme boyutu"],
        ["43 ms", "Sunucu yanıtı, edge"],
        ["3", "Uçtan uca yayınlanan dil"],
        ["0.00", "Kümülatif düzen kayması"],
      ],
    },
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
    workIntro: "Deux produits sont publics et en ligne. Deux constructions privées actives sont montrées avec leurs limites intactes.",
    workCta: "Explorer toutes les études de cas",
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
    evidence: {
      kicker: "Ce site est la preuve / Mesuré, pas promis",
      note: "Le site du studio est livré au standard que nous vendons. Mesures Lighthouse et production, août 2026.",
      items: [
        ["100·100·100", "Accessibilité · SEO · bonnes pratiques"],
        ["430 Ko", "Premier chargement, accueil"],
        ["43 ms", "Réponse serveur, edge"],
        ["3", "Langues livrées de bout en bout"],
        ["0.00", "Décalage de mise en page cumulé"],
      ],
    },
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

          <h1>
            <span className="hero-line"><span className="hero-line-inner">{copy.hero[0]}</span></span>
            <span className="hero-line"><span className="hero-line-inner">{copy.hero[1]} <em>{copy.hero[2]}</em></span></span>
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
          <ProductConstellation locale={locale} />
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
        <VisualProofReel locale={locale} />
        <div className="visual-proof-all" data-reveal>
          <Link href={localizePath("/case-studies", locale)} className="studio-text-link">
            {copy.workCta} <ArrowUpRight />
          </Link>
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

      <section className="studio-evidence" data-reveal>
        <div className="studio-evidence-head">
          <p className="studio-kicker">{copy.evidence.kicker}</p>
          <p>{copy.evidence.note}</p>
        </div>
        <dl>
          {copy.evidence.items.map(([value, label]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
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
