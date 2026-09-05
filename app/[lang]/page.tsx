import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ConnectedFlow } from "@/components/ConnectedFlow";
import { ServiceGallery } from "@/components/ServiceGallery";
import { CONNECTED_COPY } from "@/lib/connectedFlow";
import "../connected-flow.css";
import { BitcoinDesk } from "@/components/BitcoinDesk";
import { localizePath, SITE_DESCRIPTIONS } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { createPageMetadata } from "@/lib/metadata";
import { SERVICES_COPY } from "@/lib/services";

const COPY = {
  en: {
    title: "Websites, software & automation",
    kicker: "Websites, software & automation",
    workKicker: "Selected work", workHeading: "Real projects. Clear ownership.",
    work: [
      { title: "HodlStay", tag: "Client build · Live", text: "A booking platform with guest and host journeys, payment integrations and a full-stack rebuild.", image: "/work/hodlstay-2026-09-home.jpg", alt: "HodlStay booking platform homepage", slug: "hodlstay" },
      { title: "Satoshi Gazette", tag: "Owned project · Editorially independent", text: "A publication with data dashboards and source-linked editorial workflows. Our own working example, not a client engagement.", image: "/work/satoshi-gazette-2026-09-home.jpg", alt: "Satoshi Gazette publication homepage", slug: "satoshi-gazette" },
    ],
    how: "How we work", steps: [
      ["Tell us what needs to change", "An idea, a broken process or an existing product. Start with what matters to your business."],
      ["Agree a useful first project", "We define what will be delivered, what is outside scope, the price and who is responsible."],
      ["Build, test and hand over", "Review the work as it develops. Get a tested delivery and the instructions to use it."],
    ],
    close: "One useful change can be a good start.",
  },
  tr: {
    title: "Web siteleri, yazılım ve otomasyon",
    kicker: "Web siteleri, yazılım ve otomasyon",
    workKicker: "Seçili projeler", workHeading: "Gerçek projeler. Açık sahiplik.",
    work: [
      { title: "HodlStay", tag: "Müşteri projesi · Yayında", text: "Misafir ve ev sahibi akışları, ödeme entegrasyonları ve uçtan uca yeniden geliştirmeyle bir rezervasyon platformu.", image: "/work/hodlstay-2026-09-home.jpg", alt: "HodlStay rezervasyon platformu ana sayfası", slug: "hodlstay" },
      { title: "Satoshi Gazette", tag: "Kendi projemiz · Editoryal olarak bağımsız", text: "Veri panelleri ve kaynaklara bağlı editoryal iş akışlarıyla bir yayın. Müşteri işi değil, çalışan kendi projemiz.", image: "/work/satoshi-gazette-2026-09-home.jpg", alt: "Satoshi Gazette yayın ana sayfası", slug: "satoshi-gazette" },
    ],
    how: "Nasıl çalışıyoruz?", steps: [
      ["Neyin değişmesi gerektiğini anlatın", "Bir fikir, aksayan süreç veya mevcut ürün. İşiniz için önemli olan ihtiyaçtan başlayın."],
      ["Faydalı bir ilk proje belirleyelim", "Teslim edilecekleri, kapsam dışını, ücreti ve sorumlulukları netleştiririz."],
      ["Geliştirelim, test edelim, teslim edelim", "İlerlerken çalışmayı inceleyin. Test edilmiş teslimi ve kullanım rehberini alın."],
    ],
    close: "Faydalı bir değişiklik iyi bir başlangıçtır.",
  },
  fr: {
    title: "Sites web, logiciels & automatisation",
    kicker: "Sites web, logiciels & automatisation",
    workKicker: "Projets sélectionnés", workHeading: "Des projets réels. Des rôles clairs.",
    work: [
      { title: "HodlStay", tag: "Projet client · En ligne", text: "Une plateforme de réservation avec parcours voyageurs et hôtes, intégrations de paiement et refonte complète.", image: "/work/hodlstay-2026-09-home.jpg", alt: "Page d’accueil de la plateforme HodlStay", slug: "hodlstay" },
      { title: "Satoshi Gazette", tag: "Projet propre · Indépendance éditoriale", text: "Une publication avec tableaux de données et processus éditoriaux reliés aux sources. Notre propre réalisation, pas une mission client.", image: "/work/satoshi-gazette-2026-09-home.jpg", alt: "Page d’accueil de Satoshi Gazette", slug: "satoshi-gazette" },
    ],
    how: "Comment nous travaillons", steps: [
      ["Dites-nous ce qui doit changer", "Une idée, un processus défaillant ou un produit existant. Commencez par votre besoin."],
      ["Définissons un premier projet utile", "Nous précisons les livrables, les limites du périmètre, le prix et les responsabilités."],
      ["Construire, tester et transmettre", "Suivez le travail au fil du projet. Recevez une livraison testée et son mode d’emploi."],
    ],
    close: "Un changement utile est un bon début.",
  },
} as const;

export async function generateMetadata(props: LocalePageProps) {
  const locale = await getPageLocale(props.params);
  return createPageMetadata({ title: `MaydaLabs — ${COPY[locale].title}`, socialTitle: COPY[locale].title, description: SITE_DESCRIPTIONS[locale], path: "/", locale });
}

export default async function Home(props: LocalePageProps) {
  const locale = await getPageLocale(props.params);
  const copy = COPY[locale];
  const services = SERVICES_COPY[locale];
  const connected = CONNECTED_COPY[locale];
  return (
    <div className="mayda-home mayda-connected">
      <section className="mc-hero">
        <ConnectedFlow copy={connected.flow} />
        <div className="mc-copy">
          <p className="mc-eyebrow">{copy.kicker}</p>
          <h1>{connected.hero[0]}<em>{connected.hero[1]}</em></h1>
          <p className="mc-lead">{connected.intro}</p>
          <div className="mc-actions">
            <Link href={localizePath("/contact", locale)} className="mc-cta">{services.cta} <span aria-hidden>↗</span></Link>
            <Link href={localizePath("/case-studies", locale)} className="mc-secondary">{services.work} <span aria-hidden>→</span></Link>
          </div>
        </div>
      </section>

      <ServiceGallery locale={locale} />

      <section id="selected-work" className="mayda-section">
        <div className="mayda-shell mayda-stack-lg">
          <header><p className="mayda-kicker">{copy.workKicker}</p><h2 className="mayda-heading">{copy.workHeading}</h2></header>
          <div className="mayda-grid-2">
            {copy.work.map((item) => (
              <Link key={item.slug} href={localizePath(`/case-studies/${item.slug}`, locale)} className="mayda-work-card">
                <figure><Image src={item.image} alt={item.alt} width={1430} height={894} sizes="(max-width: 720px) 100vw, 46vw" /></figure>
                <div className="mayda-work-card-body"><span className="mayda-tag is-cobalt">{item.tag}</span><h3>{item.title}</h3><p>{item.text}</p></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="how-we-work" className="mayda-section">
        <div className="mayda-shell mayda-stack-lg">
          <h2 className="mayda-heading">{copy.how}</h2>
          <div className="mayda-grid-3">{copy.steps.map(([title, text], index) => <article key={title} className="mayda-card"><p className="mayda-card-number">0{index + 1}</p><h3 className="mayda-subheading">{title}</h3><p className="mayda-body mt-3">{text}</p></article>)}</div>
          <p className="mayda-body" style={{ maxWidth: "48rem" }}>{services.scope}</p>
        </div>
      </section>

      {/* Secondary interest, retained by explicit request; never the sales entry point. */}
      <div id="bitcoin-dashboard"><Suspense fallback={null}><BitcoinDesk locale={locale} /></Suspense></div>

      <section className="mayda-final-cta mayda-shell">
        <h2 className="mayda-heading">{copy.close}</h2>
        <p className="mayda-body" style={{ maxWidth: "38rem" }}>{services.unsureText}</p>
        <Link href={localizePath("/contact", locale)} className="mayda-button">{services.cta} <span aria-hidden>→</span></Link>
      </section>
    </div>
  );
}
