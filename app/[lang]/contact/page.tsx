import Link from "next/link";
import { BriefComposer } from "@/components/BriefComposer";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { getIntroCallUrl } from "@/lib/marketingLinks";
import { createPageMetadata } from "@/lib/metadata";

const COPY = {
  en: {
    meta: { title: "What do you need?", socialTitle: "Shape your project brief · MaydaLabs", description: "Choose the product, growth, commerce, or controlled-automation problem you want MaydaLabs to help move." }, availability: "Open for new client work", kicker: "Start here / Brief or calendar", heading: ["What do you need", "to move?"], intro: "Describe an idea or problem in your own words, or open the 30-minute calendar if a conversation is easier. Nothing is sent until you choose an external action.", choose: "Present an idea or problem", meeting: "Open the 30-minute calendar", email: "Email directly", pathsKicker: "If a category helps", pathsHeading: "What kind of work is closest?", explore: "Choose this path",
    points: [["01", "Ship a product", "An app, marketplace, SaaS product, or internal system that needs a credible first release.", "/contact?need=product#brief"], ["02", "Rebuild a system", "A product or storefront that works today but cannot support where the business needs to go.", "/contact?need=commerce#brief"], ["03", "Build a growth engine", "A shipped product that needs better measurement, conversion, lifecycle, SEO, or market momentum.", "/contact?need=growth#brief"], ["04", "Make AI useful and controlled", "A research, content, operations, or decision workflow that needs automation without losing evidence or human approval.", "/contact?need=automation#brief"]],
    steps: [["01", "What to bring", "The problem, who it is for, what exists today, and what a useful first outcome would look like."], ["02", "What we’ll cover", "Fit, product direction, likely scope, major risks, and the strongest first phase."], ["03", "What happens next", "If there is a fit, we send a tailored scope, timing, and commercial proposal. Pricing is discussed after the project is understood."]], async: "Prefer async?", location: "We work from Istanbul with founders anywhere.",
  },
  tr: {
    meta: { title: "Neye ihtiyacınız var?", socialTitle: "Proje brief'inizi şekillendirin · MaydaLabs", description: "MaydaLabs'in ilerletmesini istediğiniz ürün, büyüme, e-ticaret veya kontrollü otomasyon problemini seçin." }, availability: "Yeni müşteri projelerine açık", kicker: "Buradan başlayın / Brief veya takvim", heading: ["Neyi ilerletmeye", "ihtiyacınız var?"], intro: "Fikrinizi veya probleminizi kendi kelimelerinizle anlatın ya da konuşmak daha kolaysa 30 dakikalık takvimi açın. Siz harici bir eylem seçene kadar hiçbir şey gönderilmez.", choose: "Bir fikir veya problem anlat", meeting: "30 dakikalık takvimi aç", email: "Doğrudan e-posta yaz", pathsKicker: "Bir kategori yardımcı olursa", pathsHeading: "Hangi iş türü en yakın?", explore: "Bu yolu seç",
    points: [["01", "Bir ürün yayınlayın", "Güven veren bir ilk sürüme ihtiyaç duyan uygulama, pazar yeri, SaaS ürünü veya iç sistem.", "/contact?need=product#brief"], ["02", "Bir sistemi yeniden kurun", "Bugün çalışan fakat işletmenin gideceği yeri destekleyemeyen ürün veya mağaza.", "/contact?need=commerce#brief"], ["03", "Bir büyüme motoru kurun", "Daha iyi ölçüm, dönüşüm, yaşam döngüsü, SEO veya pazar ivmesi gereken canlı ürün.", "/contact?need=growth#brief"], ["04", "Yapay zekâyı faydalı ve kontrollü kılın", "Kanıtı ve insan onayını kaybetmeden otomasyona ihtiyaç duyan araştırma, içerik, operasyon veya karar akışı.", "/contact?need=automation#brief"]],
    steps: [["01", "Neler getirmelisiniz", "Problem, kimin için olduğu, bugün nelerin mevcut olduğu ve faydalı ilk sonucun nasıl görüneceği."], ["02", "Neleri konuşacağız", "Uyum, ürün yönü, muhtemel kapsam, büyük riskler ve en güçlü ilk aşama."], ["03", "Sonra ne olacak", "Uyum varsa size özel kapsam, zamanlama ve ticari teklif göndeririz. Fiyatlandırma proje anlaşıldıktan sonra konuşulur."]], async: "Yazılı ilerlemeyi mi tercih edersiniz?", location: "İstanbul’dan dünyanın her yerindeki kurucularla çalışıyoruz.",
  },
  fr: {
    meta: { title: "De quoi avez-vous besoin ?", socialTitle: "Structurez votre brief projet · MaydaLabs", description: "Choisissez le problème produit, croissance, e-commerce ou automatisation contrôlée que MaydaLabs doit faire avancer." }, availability: "Ouvert à de nouveaux projets clients", kicker: "Commencez ici / Brief ou agenda", heading: ["Que devez-vous", "faire avancer ?"], intro: "Décrivez une idée ou un problème avec vos mots, ou ouvrez l’agenda de 30 minutes si une conversation est plus simple. Rien n’est envoyé avant que vous ne choisissiez une action externe.", choose: "Présenter une idée ou un problème", meeting: "Ouvrir l’agenda de 30 minutes", email: "Écrire directement", pathsKicker: "Si une catégorie vous aide", pathsHeading: "Quel type de travail est le plus proche ?", explore: "Choisir ce parcours",
    points: [["01", "Livrer un produit", "Une application, marketplace, SaaS ou système interne qui a besoin d’une première version crédible.", "/contact?need=product#brief"], ["02", "Reconstruire un système", "Un produit ou une boutique qui fonctionne aujourd’hui mais ne peut soutenir la suite de l’activité.", "/contact?need=commerce#brief"], ["03", "Construire un moteur de croissance", "Un produit livré qui a besoin de meilleure mesure, conversion, cycle de vie, SEO ou dynamique marché.", "/contact?need=growth#brief"], ["04", "Rendre l’IA utile et contrôlée", "Un workflow de recherche, contenu, opérations ou décision à automatiser sans perdre les preuves ni la validation humaine.", "/contact?need=automation#brief"]],
    steps: [["01", "Ce qu’il faut apporter", "Le problème, son public, ce qui existe aujourd’hui et la forme d’un premier résultat utile."], ["02", "Ce que nous aborderons", "Adéquation, direction produit, périmètre probable, risques majeurs et meilleure première phase."], ["03", "La suite", "S’il y a adéquation, nous envoyons un périmètre, un calendrier et une proposition sur mesure. Le prix vient après la compréhension du projet."]], async: "Vous préférez l’asynchrone ?", location: "Depuis Istanbul, nous travaillons avec des fondateurs partout dans le monde.",
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
    <div className="studio-inner-page">
      <section className="studio-inner-hero contact-hero">
        <div className="studio-availability studio-availability-dark"><span /> {copy.availability}</div><p className="studio-kicker">{copy.kicker}</p>
        <h1>{copy.heading[0]}<br /><em>{copy.heading[1]}</em></h1><p>{copy.intro}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap"><a href="#brief" className="studio-button">{copy.choose} <span aria-hidden>↓</span></a><a href={getIntroCallUrl("contact_hero")} target="_blank" rel="noopener noreferrer" className="studio-button studio-button-ghost">{copy.meeting} <span aria-hidden>↗</span></a><a href="mailto:info@maydalabs.com" className="studio-button studio-button-ghost">{copy.email}</a></div>
      </section>
      <section className="contact-paths" id="needs">
        <div className="contact-paths-heading"><p className="studio-kicker">{copy.pathsKicker}</p><h2>{copy.pathsHeading}</h2></div>
        <div className="contact-paths-grid">{copy.points.map(([number, title, description, href]) => <Link key={number} href={localizePath(href, locale)}><span>{number}</span><h3>{title}</h3><p>{description}</p><b>{copy.explore} <i aria-hidden>↗</i></b></Link>)}</div>
      </section>
      <BriefComposer locale={locale} initialMove={requestedMove} />
      <section className="contact-grid">{copy.steps.map(([number, title, description]) => <article key={number}><span>{number}</span><h2>{title}</h2><p>{description}</p></article>)}</section>
      <section className="contact-direct"><p className="studio-kicker">{copy.async}</p><a href="mailto:info@maydalabs.com">info@maydalabs.com <span aria-hidden>↗</span></a><p>{copy.location}</p></section>
    </div>
  );
}
