import Image from "next/image";
import Link from "next/link";
import { localizePath, type Locale } from "@/lib/i18n";
import { SERVICES, SERVICES_COPY, type ServiceId } from "@/lib/services";
import { SERVICE_PAGES, SERVICE_RELATED, SERVICE_UI, servicePath } from "@/lib/servicePages";
import { ServiceVisual } from "@/components/ServiceVisual";
import "@/app/services.css";

export function ServiceLanding({ id, locale }: { id: ServiceId; locale: Locale }) {
  const service = SERVICES[locale].find(item => item.id === id)!;
  const page = SERVICE_PAGES[locale][id];
  const c = SERVICE_UI[locale];
  const shared = SERVICES_COPY[locale];
  const contact = localizePath("/contact", locale);
  const caseKey = id === "automation" ? "satoshi-gazette" : "hodlstay";
  const caseName = id === "automation" ? "Satoshi Gazette" : "HodlStay";
  const questions = [...page.faq, [c.costQ, c.costA]];

  return <div className={`svc-page svc-page-${id}`}>
    <div className="svc-shell">
      <nav className="svc-breadcrumb" aria-label={c.all}><Link href={localizePath("/services", locale)}>{c.all}</Link><span aria-hidden="true">/</span><span aria-current="page">{service.title}</span></nav>
      <section className="svc-hero">
        <div><p className="mayda-kicker">{service.title}</p><h1>{page.headline}</h1><p className="svc-hero-intro">{service.summary}</p><div className="svc-hero-actions"><Link className="mayda-button" href={contact}>{shared.cta} <span aria-hidden="true">↗</span></Link><a href="#scope">{c.scopeLink} <span aria-hidden="true">↓</span></a></div><p className="svc-assurance">{c.noGate}</p></div>
        <div className="svc-hero-art"><ServiceVisual id={id} locale={locale}/></div>
      </section>

      <section className="svc-fit" aria-labelledby="service-fit"><h2 id="service-fit">{c.fit}</h2><ul>{page.fit.map(item => <li key={item}>{item}</li>)}</ul></section>

      <section id="scope" className="svc-scope"><p className="mayda-kicker">{c.scope}</p><h2>{service.need}</h2><div className="svc-scope-grid">{service.deliverables.map((item, index) => <article className="svc-scope-item" key={item}><span aria-hidden="true">0{index + 1}</span><h3>{item}</h3><p>{page.scope[index]}</p></article>)}</div></section>

      <section className="svc-proof" aria-labelledby="service-proof">
        {id === "email" ? <ServiceVisual id="email" locale={locale}/> : <Link className="svc-proof-image" href={localizePath(`/case-studies/${caseKey}`, locale)} aria-label={`${caseName} — ${c.case}`}><Image src={`/work/${caseKey}-2026-09-home.jpg`} alt={caseName} width={1430} height={894} sizes="(max-width: 760px) 85vw, 43vw"/></Link>}
        <div className="svc-proof-copy"><p className="mayda-kicker">{id === "email" ? c.approach : c.proof}</p><h2 id="service-proof">{id === "email" ? c.proofEmailTitle : caseName}</h2>{id !== "email" && <p className="mayda-tag">{id === "automation" ? c.owned : c.client}</p>}<p>{page.proof}</p>{id !== "email" && <Link className="mayda-text-link" href={localizePath(`/case-studies/${caseKey}`, locale)}>{c.case} <span aria-hidden="true">↗</span></Link>}</div>
      </section>

      <section className="svc-faq"><h2>{c.questions}</h2><div>{questions.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>

      <section className="svc-next"><div><p className="mayda-kicker">{c.next}</p><h2>{page.cta}</h2></div><div><p>{page.start}</p><Link className="mayda-button" href={contact}>{shared.cta} <span aria-hidden="true">↗</span></Link></div></section>
      <nav className="svc-related" aria-label={c.related}><h2>{c.related}</h2><div className="svc-related-links">{SERVICE_RELATED[id].map(related => <Link key={related} href={localizePath(servicePath(related), locale)}>{SERVICES[locale].find(item => item.id === related)!.title}<span aria-hidden="true">↗</span></Link>)}</div></nav>
    </div>
  </div>;
}
