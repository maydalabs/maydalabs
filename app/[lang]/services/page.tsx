import Link from "next/link";
import { SERVICES, SERVICES_COPY } from "@/lib/services";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { createPageMetadata } from "@/lib/metadata";

export async function generateMetadata(props: LocalePageProps) {
  const locale = await getPageLocale(props.params);
  const copy = SERVICES_COPY[locale];
  return createPageMetadata({ title: copy.kicker, socialTitle: copy.heading, description: copy.intro, path: "/services", locale, socialCard: "approach" });
}

export default async function ServicesPage(props: LocalePageProps) {
  const locale = await getPageLocale(props.params);
  const copy = SERVICES_COPY[locale];
  return <div className="mayda-page">
    <section className="mayda-section"><div className="mayda-shell mayda-stack-lg">
      <header className="mayda-stack"><p className="mayda-kicker">{copy.kicker}</p><h1 className="mayda-display" style={{ maxWidth: "19ch" }}>{copy.heading}</h1><p className="mayda-body" style={{ maxWidth: "44rem" }}>{copy.intro}</p></header>
      <nav aria-label={copy.kicker} className="flex flex-wrap gap-3">{SERVICES[locale].map(service => <a key={service.id} href={`#${service.id}`} className="mayda-tag">{service.title} ↓</a>)}</nav>
      {SERVICES[locale].map((service, index) => <article key={service.id} id={service.id} className="mayda-service-detail">
        <div className="mayda-stack"><p className="mayda-card-number">0{index + 1}</p><h2 className="mayda-heading">{service.title}</h2><p className="mayda-subheading">{service.need}</p><p className="mayda-body">{service.summary}</p><Link href={localizePath("/contact", locale)} className="mayda-text-link">{copy.cta} <span aria-hidden>→</span></Link></div>
        <div className="mayda-card mayda-stack"><h3 className="mayda-kicker">{copy.includes}</h3><ul className="mayda-service-deliverables">{service.deliverables.map(item => <li key={item}>{item}</li>)}</ul><p className="mayda-body"><strong className="text-[color:var(--frost)]">{copy.example}: </strong>{service.example}</p></div>
      </article>)}
      <p className="mayda-body" style={{ maxWidth: "48rem" }}>{copy.scope}</p>
    </div></section>
    <section className="mayda-final-cta mayda-shell"><h2 className="mayda-heading">{copy.unsure}</h2><p className="mayda-body" style={{ maxWidth: "40rem" }}>{copy.unsureText}</p><div className="mayda-hero-actions"><Link href={localizePath("/contact", locale)} className="mayda-button">{copy.cta} →</Link><Link href={localizePath("/case-studies", locale)} className="mayda-button mayda-button-outline">{copy.work}</Link></div></section>
  </div>;
}
