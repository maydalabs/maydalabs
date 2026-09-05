import Link from "next/link";
import { SERVICES, SERVICES_COPY } from "@/lib/services";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { createPageMetadata } from "@/lib/metadata";
import { ServiceGallery } from "@/components/ServiceGallery";
import { SERVICE_UI } from "@/lib/servicePages";
import "@/app/services.css";

export async function generateMetadata(props: LocalePageProps) {
  const locale = await getPageLocale(props.params);
  const copy = SERVICES_COPY[locale];
  return createPageMetadata({ title: copy.kicker, socialTitle: copy.heading, description: copy.intro, path: "/services", locale, socialCard: "approach" });
}

export default async function ServicesPage(props: LocalePageProps) {
  const locale = await getPageLocale(props.params);
  const copy = SERVICES_COPY[locale];
  const ui = SERVICE_UI[locale];
  return <div className="svc-page">
    <header className="svc-overview-head svc-shell"><p className="mayda-kicker">{copy.kicker}</p><h1>{ui.homeTitle}</h1><p>{copy.intro}</p><nav aria-label={copy.kicker}>{SERVICES[locale].map(service => <a key={service.id} href={`#${service.id}`}>{service.title} <span aria-hidden="true">↓</span></a>)}</nav></header>
    <ServiceGallery locale={locale} overview/>
    <section className="svc-next svc-shell"><div><p className="mayda-kicker">{ui.next}</p><h2>{copy.unsure}</h2></div><div><p>{copy.unsureText}</p><Link href={localizePath("/contact", locale)} className="mayda-button">{copy.cta} <span aria-hidden="true">↗</span></Link><p className="svc-assurance">{copy.scope}</p></div></section>
    <div className="svc-related svc-shell"><Link href={localizePath("/case-studies", locale)} className="mayda-text-link">{copy.work} <span aria-hidden="true">→</span></Link></div>
  </div>;
}
