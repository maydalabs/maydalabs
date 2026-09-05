import Link from "next/link";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { createPageMetadata } from "@/lib/metadata";

const COPY = {
  en: {
    meta: {
      title: "About",
      socialTitle: "Founder-led, evidence first · MaydaLabs",
      description:
        "MaydaLabs builds websites, software and connected workflows. Founder-led by Mehmet E. Mayda, based in Istanbul and working worldwide.",
    },
    kicker: "About",
    heading: ["Work directly with the builder.","Start with what your business needs."],
    lead: "MaydaLabs helps founders and businesses build new things and improve how they work. Led by Mehmet E. Mayda, a full-stack builder based in Istanbul, the work connects websites, software, automation and customer communication.",
    story: [
      "There is no pretend agency floor here. Engagements are led and largely built by one accountable person, extended by carefully scoped automation and AI systems where they genuinely help. That constraint is a feature: you talk to the person who builds, and the person who builds owns the outcome.",
      "The work spans complete products — marketplaces, publications, operational systems — because founder-led businesses rarely have problems that respect a single discipline. Product, automation, growth, and security get treated as one connected system.",
      "Everything shown as proof on this site carries its real label: client work is client work, owned products are owned products, and private-stage builds say so. If a claim can't be inspected, it doesn't get made.",
    ],
    factsLabel: "Plain facts",
    facts: [
      ["Founded and led by", "Mehmet E. Mayda"],
      ["Based in", "Istanbul, working worldwide"],
      ["Languages", "English, Turkish, French site"],
      ["Model", "Founder-led, project-based delivery"],
    ],
    principlesKicker: "How the company behaves",
    principles: [
      ["Evidence first", "Live products over decks. Real screenshots over concepts. Labels over vibes."],
      ["One accountable owner", "The person you talk to is the person who ships and answers for it."],
      ["Leverage over headcount", "Automation and carefully scoped AI extend one builder — they don't impersonate a team."],
      ["Boundaries respected", "Client confidentiality, editorial independence of owned publications, and your ownership of everything delivered."],
    ],
    profileNote: "Looking for the deeper founder background — track record, stack, hiring context?",
    profileCta: "Read the founder profile",
    ctaHeading: "See how the work happens, or start yours.",
    approachCta: "Explore services",
    mapCta: "Tell us what you need",
  },
  tr: {
    meta: {
      title: "Hakkında",
      socialTitle: "Kurucu liderliğinde, önce kanıt · MaydaLabs",
      description:
        "MaydaLabs web siteleri, yazılım ve bağlantılı iş akışları geliştirir. Mehmet E. Mayda liderliğinde, İstanbul'dan dünya çapında çalışır.",
    },
    kicker: "Hakkında",
    heading: ["Geliştiriciyle doğrudan çalışın.","İşinizin ihtiyacından başlayın."],
    lead: "MaydaLabs, girişimcilere ve şirketlere yeni ürünler geliştirmede ve işlerini iyileştirmede yardımcı olur. İstanbul merkezli full-stack geliştirici Mehmet E. Mayda liderliğinde web siteleri, yazılım, otomasyon ve müşteri iletişimini bir araya getirir.",
    story: [
      "Burada yapay bir ajans katı yok. Çalışmaları sorumluluğu üstlenen tek kişi yönetir ve büyük ölçüde inşa eder; gerçekten işe yaradığı yerde dikkatle kapsamlanmış otomasyon ve yapay zekâ sistemleri onu genişletir. Bu kısıt bir özelliktir: konuştuğunuz kişi inşa eden kişidir ve inşa eden kişi sonucun sahibidir.",
      "İş, eksiksiz ürünlere uzanır — pazar yerleri, yayınlar, operasyon sistemleri — çünkü kurucu liderliğindeki işletmelerin problemleri nadiren tek bir disipline saygı duyar. Ürün, otomasyon, büyüme ve güvenlik birbirine bağlı tek sistem olarak ele alınır.",
      "Bu sitede kanıt olarak gösterilen her şey gerçek etiketini taşır: müşteri işi müşteri işidir, sahip olunan ürünler sahip olunan ürünlerdir ve özel aşamadaki geliştirmeler bunu söyler. Bir iddia denetlenemiyorsa, dile getirilmez.",
    ],
    factsLabel: "Yalın gerçekler",
    facts: [
      ["Kuran ve yöneten", "Mehmet E. Mayda"],
      ["Merkez", "İstanbul, dünya çapında çalışır"],
      ["Diller", "İngilizce, Türkçe, Fransızca site"],
      ["Model", "Kurucu liderliğinde, proje bazlı çalışma"],
    ],
    principlesKicker: "Şirket nasıl davranır",
    principles: [
      ["Önce kanıt", "Sunum yerine canlı ürünler. Konsept yerine gerçek ekran görüntüleri. Havadan söz yerine etiketler."],
      ["Tek sorumlu sahip", "Konuştuğunuz kişi, işi yayınlayan ve hesabını veren kişidir."],
      ["Kadro yerine kaldıraç", "Otomasyon ve dikkatle kapsamlanmış yapay zekâ tek geliştiriciyi genişletir — ekip taklidi yapmaz."],
      ["Sınırlara saygı", "Müşteri gizliliği, sahip olunan yayınların editoryal bağımsızlığı ve teslim edilen her şeyin sizin mülkiyetiniz olması."],
    ],
    profileNote: "Daha derin kurucu geçmişi mi arıyorsunuz — geçmiş işler, stack, işe alım bağlamı?",
    profileCta: "Kurucu profilini okuyun",
    ctaHeading: "İşin nasıl yapıldığını görün veya kendi işinizi başlatın.",
    approachCta: "Hizmetleri inceleyin",
    mapCta: "İhtiyacınızı anlatın",
  },
  fr: {
    meta: {
      title: "À propos",
      socialTitle: "Dirigé par le fondateur, preuves d'abord · MaydaLabs",
      description:
        "MaydaLabs crée des sites, des logiciels et des processus connectés. Dirigé par Mehmet E. Mayda depuis Istanbul, pour des entreprises partout dans le monde.",
    },
    kicker: "À propos",
    heading: ["Travaillez directement avec le développeur.","Partez des besoins de votre entreprise."],
    lead: "MaydaLabs aide les fondateurs et les entreprises à construire et à mieux travailler. Dirigé par Mehmet E. Mayda, développeur full-stack à Istanbul, le travail relie sites web, logiciels, automatisation et communication client.",
    story: [
      "Pas de faux plateau d'agence ici. Les missions sont dirigées et largement construites par une personne responsable, étendue par des systèmes d'automatisation et d'IA soigneusement cadrés là où ils aident vraiment. Cette contrainte est une qualité : vous parlez à la personne qui construit, et la personne qui construit répond du résultat.",
      "Le travail couvre des produits complets — marketplaces, publications, systèmes opérationnels — parce que les problèmes des entreprises de fondateurs respectent rarement une seule discipline. Produit, automatisation, croissance et sécurité sont traités comme un seul système connecté.",
      "Tout ce qui sert de preuve sur ce site porte sa vraie étiquette : le travail client est du travail client, les produits détenus sont des produits détenus, et les builds en phase privée le disent. Une affirmation qui ne peut pas être inspectée n'est pas faite.",
    ],
    factsLabel: "Faits simples",
    facts: [
      ["Fondée et dirigée par", "Mehmet E. Mayda"],
      ["Basée à", "Istanbul, travaille dans le monde entier"],
      ["Langues", "Site en anglais, turc, français"],
      ["Modèle", "Dirigé par le fondateur, avec des projets au périmètre défini"],
    ],
    principlesKicker: "Comment l'entreprise se comporte",
    principles: [
      ["Les preuves d'abord", "Des produits en ligne plutôt que des decks. De vraies captures plutôt que des concepts. Des étiquettes plutôt que du vent."],
      ["Un seul responsable", "La personne à qui vous parlez est celle qui livre et qui en répond."],
      ["Du levier plutôt que des effectifs", "L'automatisation et une IA soigneusement cadrée étendent un builder — elles n'imitent pas une équipe."],
      ["Des frontières respectées", "Confidentialité client, indépendance éditoriale des publications détenues, et votre propriété de tout ce qui est livré."],
    ],
    profileNote: "Vous cherchez le parcours détaillé du fondateur — réalisations, stack, contexte de recrutement ?",
    profileCta: "Lire le profil du fondateur",
    ctaHeading: "Voyez comment le travail se fait, ou commencez le vôtre.",
    approachCta: "Explorer les services",
    mapCta: "Parlez-nous de votre besoin",
  },
} as const;

export async function generateMetadata({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  return createPageMetadata({ ...COPY[locale].meta, path: "/about", locale, socialCard: "about" });
}

export default async function AboutPage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  const copy = COPY[locale];

  return (
    <div className="mayda-shell">
      <section className="mayda-section">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-16">
          <header className="mayda-stack">
            <p className="mayda-kicker">{copy.kicker}</p>
            <h1 className="mayda-display" style={{ fontSize: "clamp(2.2rem,5vw,3.8rem)" }}>
              {copy.heading[0]}
              <br />
              <span className="mayda-multiply">{copy.heading[1]}</span>
            </h1>
            <p className="mayda-lead">{copy.lead}</p>
            <div className="mayda-stack" style={{ marginTop: "0.6rem" }}>
              {copy.story.map((paragraph) => (
                <p key={paragraph.slice(0, 24)} className="mayda-body" style={{ maxWidth: "42rem" }}>
                  {paragraph}
                </p>
              ))}
            </div>
          </header>

          <aside className="mayda-card" style={{ alignSelf: "start" }} aria-label={copy.factsLabel}>
            <p className="mayda-kicker">{copy.factsLabel}</p>
            <dl className="mayda-dl">
              {copy.facts.map(([term, detail]) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>{detail}</dd>
                </div>
              ))}
            </dl>
            <p className="mayda-body mt-5" style={{ fontSize: "0.9rem" }}>
              {copy.profileNote}{" "}
              <Link href={localizePath("/profile", locale)} className="mayda-text-link">
                {copy.profileCta} <span aria-hidden>→</span>
              </Link>
            </p>
          </aside>
        </div>
      </section>

      <section className="mayda-section" style={{ paddingTop: 0 }}>
        <p className="mayda-kicker">{copy.principlesKicker}</p>
        <div className="mayda-grid-2" style={{ marginTop: "1.4rem" }}>
          {copy.principles.map(([title, text]) => (
            <article key={title} className="mayda-card">
              <h2 className="mayda-subheading">{title}</h2>
              <p className="mayda-body mt-3">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mayda-final-cta">
        <h2 className="mayda-heading">{copy.ctaHeading}</h2>
        <div className="mayda-hero-actions" style={{ justifyContent: "center" }}>
          <Link href={localizePath("/services", locale)} className="mayda-button mayda-button-outline">
            {copy.approachCta}
          </Link>
          <Link href={localizePath("/contact", locale)} className="mayda-button">
            {copy.mapCta} <span aria-hidden>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
