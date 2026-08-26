import { BriefComposer } from "@/components/BriefComposer";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { getIntroCallUrl } from "@/lib/marketingLinks";
import { createPageMetadata } from "@/lib/metadata";

const COPY = {
  en: {
    meta: { title: "Start a project", socialTitle: "Start with the problem · MaydaLabs", description: "Turn a rough product, growth, commerce, or automation problem into a useful first conversation with MaydaLabs." },
    availability: "Open for new client work", kicker: "Start here / Project console", heading: ["Start with the problem.", "We’ll shape the project."],
    intro: "You do not need a polished brief or a predetermined scope. Give me enough signal to understand the friction, then choose the channel that suits you.",
    start: "Start the 60-second brief", meeting: "Skip ahead and book the call", email: "Email directly", signalLabel: "A useful first contact",
    signals: [["01", "60–90 seconds", "Three short steps, designed for rough thinking."], ["02", "Founder-led", "Your context goes directly into a conversation with Mehmet."], ["03", "Nothing sent silently", "The draft stays local until you choose a channel."]],
    stepsKicker: "After you choose a channel", stepsHeading: "A clear next step, not a sales maze.",
    steps: [["01", "Fit and direction", "We look at the problem, who it affects, what exists, and whether MaydaLabs is the right operator."], ["02", "First useful phase", "We identify the smallest credible phase, the important risks, and what evidence should exist at the end."], ["03", "Tailored proposal", "If there is a fit, scope, timing, responsibilities, and commercial terms follow in writing."]],
    async: "Prefer a direct note?", location: "Founder-led from Istanbul, working with teams anywhere.",
  },
  tr: {
    meta: { title: "Proje başlat", socialTitle: "Problemle başlayın · MaydaLabs", description: "Ham ürün, büyüme, e-ticaret veya otomasyon problemini MaydaLabs ile faydalı bir ilk görüşmeye dönüştürün." },
    availability: "Yeni müşteri projelerine açık", kicker: "Buradan başlayın / Proje konsolu", heading: ["Problemle başlayın.", "Projeyi birlikte şekillendirelim."],
    intro: "Kusursuz bir brief'e veya önceden belirlenmiş kapsama ihtiyacınız yok. Sürtünmeyi anlamam için yeterli sinyali verin, ardından size uyan kanalı seçin.",
    start: "60 saniyelik brief'i başlat", meeting: "Doğrudan görüşmeyi ayarla", email: "Doğrudan e-posta yaz", signalLabel: "Faydalı bir ilk temas",
    signals: [["01", "60–90 saniye", "Ham düşünce için tasarlanmış üç kısa adım."], ["02", "Kurucu liderliğinde", "Bağlamınız doğrudan Mehmet ile görüşmeye gider."], ["03", "Sessiz gönderim yok", "Bir kanal seçene kadar taslak yerel kalır."]],
    stepsKicker: "Kanalı seçtikten sonra", stepsHeading: "Satış labirenti değil, net bir sonraki adım.",
    steps: [["01", "Uyum ve yön", "Problemi, kimi etkilediğini, neyin mevcut olduğunu ve MaydaLabs'in doğru operatör olup olmadığını inceleriz."], ["02", "İlk faydalı aşama", "En küçük güvenilir aşamayı, önemli riskleri ve sonunda hangi kanıtların bulunması gerektiğini belirleriz."], ["03", "Size özel teklif", "Uyum varsa kapsam, zamanlama, sorumluluklar ve ticari koşullar yazılı olarak gelir."]],
    async: "Doğrudan bir notu mu tercih edersiniz?", location: "İstanbul’dan, dünyanın her yerindeki ekiplerle kurucu liderliğinde çalışıyoruz.",
  },
  fr: {
    meta: { title: "Lancer un projet", socialTitle: "Commencez par le problème · MaydaLabs", description: "Transformez un problème brut de produit, croissance, e-commerce ou automatisation en premier échange utile avec MaydaLabs." },
    availability: "Ouvert à de nouveaux projets clients", kicker: "Commencez ici / Console projet", heading: ["Commencez par le problème.", "Nous structurerons le projet."],
    intro: "Vous n’avez besoin ni d’un brief parfait ni d’un périmètre prédéfini. Donnez assez de signal pour comprendre la friction, puis choisissez le canal qui vous convient.",
    start: "Commencer le brief de 60 secondes", meeting: "Passer directement à l’échange", email: "Écrire directement", signalLabel: "Un premier contact utile",
    signals: [["01", "60–90 secondes", "Trois étapes courtes conçues pour une pensée encore brute."], ["02", "Piloté par le fondateur", "Votre contexte arrive directement dans un échange avec Mehmet."], ["03", "Aucun envoi silencieux", "Le brouillon reste local jusqu’au choix d’un canal."]],
    stepsKicker: "Après le choix du canal", stepsHeading: "Une prochaine étape claire, pas un labyrinthe commercial.",
    steps: [["01", "Adéquation et direction", "Nous examinons le problème, son public, l’existant et si MaydaLabs est le bon opérateur."], ["02", "Première phase utile", "Nous identifions la plus petite phase crédible, les risques importants et les preuves attendues à la fin."], ["03", "Proposition sur mesure", "S’il y a adéquation, périmètre, calendrier, responsabilités et conditions commerciales suivent par écrit."]],
    async: "Vous préférez une note directe ?", location: "Piloté depuis Istanbul, avec des équipes partout dans le monde.",
  },
} as const;

export async function generateMetadata({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  return createPageMetadata({ ...COPY[locale].meta, path: "/contact", locale, socialCard: "contact" });
}

export default async function ContactPage({ params, searchParams }: LocalePageProps & { searchParams: Promise<{ need?: string }> }) {
  const locale = await getPageLocale(params);
  const requestedMove = (await searchParams).need ?? null;
  const copy = COPY[locale];

  return (
    <div className="studio-inner-page contact-console-page">
      <section className="contact-console-hero">
        <div className="contact-console-intro">
          <div className="studio-availability studio-availability-dark"><span /> {copy.availability}</div>
          <p className="studio-kicker">{copy.kicker}</p>
          <h1>{copy.heading[0]}<br /><em>{copy.heading[1]}</em></h1>
          <p className="contact-console-lead">{copy.intro}</p>
          <div className="contact-console-direct">
            <a href="#brief" className="is-primary">{copy.start} <span aria-hidden="true">↓</span></a>
            <a href={getIntroCallUrl("contact_intro")} target="_blank" rel="noopener noreferrer">{copy.meeting} <span aria-hidden="true">↗</span></a>
            <a href="mailto:info@maydalabs.com">{copy.email} <span aria-hidden="true">→</span></a>
          </div>
          <div className="contact-console-signals" aria-label={copy.signalLabel}>
            {copy.signals.map(([number, title, description]) => <div key={number}><span>{number}</span><p><strong>{title}</strong><small>{description}</small></p></div>)}
          </div>
        </div>
        <BriefComposer locale={locale} initialMove={requestedMove} />
      </section>

      <section className="contact-console-next">
        <div><p className="studio-kicker">{copy.stepsKicker}</p><h2>{copy.stepsHeading}</h2></div>
        <div className="contact-grid">{copy.steps.map(([number, title, description]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></article>)}</div>
      </section>

      <section className="contact-direct"><p className="studio-kicker">{copy.async}</p><a href="mailto:info@maydalabs.com">info@maydalabs.com <span aria-hidden="true">↗</span></a><p>{copy.location}</p></section>
    </div>
  );
}
