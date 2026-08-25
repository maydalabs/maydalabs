import Link from "next/link";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { getIntroCallUrl } from "@/lib/marketingLinks";
import { createPageMetadata } from "@/lib/metadata";

const COPY = {
  en: {
    meta: { title: "Start a project", socialTitle: "Start a project · MaydaLabs", description: "Talk to MaydaLabs about your app, marketplace, commerce, or growth project." }, availability: "Open for new client work", kicker: "Start a project / Scoped after a conversation", heading: ["Tell us what you’re", "trying to make real."], intro: "Bring the idea, the half-built product, or the problem nobody has untangled yet. We’ll use the first conversation to find the signal and decide whether we should build together.", book: "Book a project call", email: "Email the brief", pathsKicker: "Choose a starting point", pathsHeading: "What kind of move are we making?", explore: "Explore the fit",
    points: [["01", "New product", "An app, marketplace, SaaS product, or internal system that needs a credible first release.", "/services#product-builds"], ["02", "Rebuild or commerce", "A product or storefront that works today but cannot support where the business needs to go.", "/services#commerce"], ["03", "Launch and growth", "A shipped product that needs better measurement, conversion, lifecycle, or market momentum.", "/services#growth-systems"]],
    steps: [["01", "What to bring", "The problem, who it is for, what exists today, and what a useful first outcome would look like."], ["02", "What we’ll cover", "Fit, product direction, likely scope, major risks, and the strongest first phase."], ["03", "What happens next", "If there is a fit, we send a tailored scope, timing, and commercial proposal. Pricing is discussed after the project is understood."]], async: "Prefer async?", location: "We work from Istanbul with founders anywhere.",
  },
  tr: {
    meta: { title: "Proje başlat", socialTitle: "Proje başlat · MaydaLabs", description: "Uygulama, pazar yeri, e-ticaret veya büyüme projenizi MaydaLabs ile konuşun." }, availability: "Yeni müşteri projelerine açık", kicker: "Proje başlat / Kapsam görüşme sonrası belirlenir", heading: ["Gerçeğe dönüştürmek", "istediğinizi anlatın."], intro: "Fikri, yarım kalmış ürünü veya henüz kimsenin çözemediği problemi getirin. İlk görüşmede sinyali bulacak ve birlikte geliştirmemiz gerekip gerekmediğine karar vereceğiz.", book: "Proje görüşmesi ayarla", email: "Brief'i e-postayla gönder", pathsKicker: "Bir başlangıç noktası seçin", pathsHeading: "Nasıl bir hamle yapıyoruz?", explore: "Uyumu incele",
    points: [["01", "Yeni ürün", "Güven veren bir ilk sürüme ihtiyaç duyan uygulama, pazar yeri, SaaS ürünü veya iç sistem.", "/services#product-builds"], ["02", "Yeniden geliştirme veya e-ticaret", "Bugün çalışan fakat işletmenin gideceği yeri destekleyemeyen ürün veya mağaza.", "/services#commerce"], ["03", "Lansman ve büyüme", "Daha iyi ölçüm, dönüşüm, yaşam döngüsü veya pazar ivmesi gereken yayınlanmış ürün.", "/services#growth-systems"]],
    steps: [["01", "Neler getirmelisiniz", "Problem, kimin için olduğu, bugün nelerin mevcut olduğu ve faydalı ilk sonucun nasıl görüneceği."], ["02", "Neleri konuşacağız", "Uyum, ürün yönü, muhtemel kapsam, büyük riskler ve en güçlü ilk aşama."], ["03", "Sonra ne olacak", "Uyum varsa size özel kapsam, zamanlama ve ticari teklif göndeririz. Fiyatlandırma proje anlaşıldıktan sonra konuşulur."]], async: "Yazılı ilerlemeyi mi tercih edersiniz?", location: "İstanbul’dan dünyanın her yerindeki kurucularla çalışıyoruz.",
  },
  fr: {
    meta: { title: "Lancer un projet", socialTitle: "Lancer un projet · MaydaLabs", description: "Parlez à MaydaLabs de votre application, marketplace, e-commerce ou projet de croissance." }, availability: "Ouvert à de nouveaux projets clients", kicker: "Lancer un projet / Cadré après un échange", heading: ["Dites-nous ce que vous", "voulez rendre réel."], intro: "Apportez l’idée, le produit à moitié construit ou le problème que personne n’a encore démêlé. Le premier échange servira à trouver le signal et décider si nous devons construire ensemble.", book: "Réserver un appel projet", email: "Envoyer le brief", pathsKicker: "Choisissez un point de départ", pathsHeading: "Quel mouvement devons-nous créer ?", explore: "Explorer l’adéquation",
    points: [["01", "Nouveau produit", "Une application, marketplace, SaaS ou système interne qui a besoin d’une première version crédible.", "/services#product-builds"], ["02", "Refonte ou e-commerce", "Un produit ou une boutique qui fonctionne aujourd’hui mais ne peut soutenir la suite de l’activité.", "/services#commerce"], ["03", "Lancement et croissance", "Un produit livré qui a besoin de meilleure mesure, conversion, cycle de vie ou dynamique marché.", "/services#growth-systems"]],
    steps: [["01", "Ce qu’il faut apporter", "Le problème, son public, ce qui existe aujourd’hui et la forme d’un premier résultat utile."], ["02", "Ce que nous aborderons", "Adéquation, direction produit, périmètre probable, risques majeurs et meilleure première phase."], ["03", "La suite", "S’il y a adéquation, nous envoyons un périmètre, un calendrier et une proposition sur mesure. Le prix vient après la compréhension du projet."]], async: "Vous préférez l’asynchrone ?", location: "Depuis Istanbul, nous travaillons avec des fondateurs partout dans le monde.",
  },
} as const;

export async function generateMetadata({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  return createPageMetadata({ ...COPY[locale].meta, path: "/contact", locale, socialCard: "contact" });
}

export default async function ContactPage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  const copy = COPY[locale];
  return (
    <div className="studio-inner-page">
      <section className="studio-inner-hero contact-hero">
        <div className="studio-availability studio-availability-dark"><span /> {copy.availability}</div><p className="studio-kicker">{copy.kicker}</p>
        <h1>{copy.heading[0]}<br /><em>{copy.heading[1]}</em></h1><p>{copy.intro}</p>
        <div className="flex flex-col gap-3 sm:flex-row"><Link href={getIntroCallUrl("contact_hero")} target="_blank" rel="noopener noreferrer" className="studio-button">{copy.book} <span aria-hidden>↗</span></Link><a href="mailto:info@maydalabs.com" className="studio-button studio-button-ghost">{copy.email}</a></div>
      </section>
      <section className="contact-paths">
        <div className="contact-paths-heading"><p className="studio-kicker">{copy.pathsKicker}</p><h2>{copy.pathsHeading}</h2></div>
        <div className="contact-paths-grid">{copy.points.map(([number, title, description, href]) => <Link key={number} href={localizePath(href, locale)}><span>{number}</span><h3>{title}</h3><p>{description}</p><b>{copy.explore} <i aria-hidden>↗</i></b></Link>)}</div>
      </section>
      <section className="contact-grid">{copy.steps.map(([number, title, description]) => <article key={number}><span>{number}</span><h2>{title}</h2><p>{description}</p></article>)}</section>
      <section className="contact-direct"><p className="studio-kicker">{copy.async}</p><a href="mailto:info@maydalabs.com">info@maydalabs.com <span aria-hidden>↗</span></a><p>{copy.location}</p></section>
    </div>
  );
}
