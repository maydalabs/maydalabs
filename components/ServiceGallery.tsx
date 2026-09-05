import Link from "next/link";
import { localizePath, type Locale } from "@/lib/i18n";
import { SERVICES } from "@/lib/services";
import { SERVICE_PAGES, SERVICE_UI, servicePath } from "@/lib/servicePages";
import { ServiceVisual } from "@/components/ServiceVisual";
import "@/app/services.css";

export function ServiceGallery({ locale, overview = false }: { locale: Locale; overview?: boolean }) {
  const c = SERVICE_UI[locale];
  const Heading = overview ? "h2" : "h3";
  return <section id={overview ? "service-options" : "services"} className={`svc-gallery${overview ? " is-overview" : ""}`}>
    {!overview && <header className="svc-section-head"><div><p className="mayda-kicker">{c.all}</p><h2>{c.homeTitle}</h2></div><p>{c.homeIntro}</p></header>}
    <div className="svc-grid">
      {SERVICES[locale].map((service, index) => <article id={overview ? service.id : undefined} key={service.id} className={`svc-card svc-card-${service.id}`}>
        <Link href={localizePath(servicePath(service.id), locale)} className="svc-card-link" aria-label={`${service.title} — ${c.explore}`}>
          <div className="svc-card-copy"><p className="svc-card-category"><span aria-hidden="true">0{index + 1}</span>{service.title}</p><Heading className="svc-card-heading">{SERVICE_PAGES[locale][service.id].card}</Heading><p className="svc-card-summary">{service.need}</p></div>
          <ServiceVisual id={service.id} locale={locale}/>
          <div className="svc-card-footer"><span>{c.explore}</span><span className="svc-card-arrow" aria-hidden="true">↗</span></div>
        </Link>
      </article>)}
    </div>
    {!overview && <div className="svc-gallery-bottom"><p>{c.ownership}</p><Link href={localizePath("/services", locale)}>{c.all} <span aria-hidden="true">→</span></Link></div>}
  </section>;
}
