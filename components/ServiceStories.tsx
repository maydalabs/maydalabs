import Link from "next/link";
import { CONNECTED_COPY, STORY_SERVICES } from "@/lib/connectedFlow";
import { localizePath, type Locale } from "@/lib/i18n";
import { SERVICES } from "@/lib/services";

/** Native radios and CSS selection keep every example usable without hydration. */
export function ServiceStories({ locale }: { locale: Locale }) {
  const copy = CONNECTED_COPY[locale].services;
  return <section id="services" className="mc-services">
    <div className="mc-section-heading"><div><p className="mc-eyebrow">{copy.kicker}</p><h2>{copy.heading}</h2></div><p className="mc-section-aside">{copy.aside}</p></div>
    <div className="mc-service-layout">
      <fieldset className="mc-choices">
        <legend className="sr-only">{copy.group}</legend>
        {copy.stories.map((story, index) => <div key={story.id}>
          <input className="mc-choice-input" id={`service-${story.id}`} name="service-example" type="radio" value={story.id} defaultChecked={index === 0} aria-controls={`example-${story.id}`}/>
          <label className="mc-choice" htmlFor={`service-${story.id}`}><span className="mc-choice-heading"><strong>{story.title}</strong><span aria-hidden="true">↗</span></span><small>{story.text}</small></label>
        </div>)}
        <p className="mc-all"><Link href={localizePath("/services", locale)}>{copy.all} <span aria-hidden="true">→</span></Link></p>
      </fieldset>
      <div className="mc-example">
        {copy.stories.map(story => <div key={story.id} className={`mc-example-panel mc-panel-${story.id}`} id={`example-${story.id}`} role="region" aria-label={`${story.label} — ${copy.illustrative}`}>
          <div className="mc-example-top"><span>{story.label}</span><span>{copy.illustrative}</span></div>
          <div className="mc-illustration">
            {story.id === "build" && <div className="mc-portal"><div className="mc-portal-top">{copy.portal.name}<span>{copy.portal.overview}</span></div><div className="mc-portal-body"><div className="mc-portal-sidebar" aria-hidden="true"><i/><i/><i/><i/></div><div><h3>{copy.portal.heading}</h3><div className="mc-portal-sub">{copy.portal.intro}</div><div className="mc-file-grid">{copy.portal.files.map((file, i) => <div className="mc-file" key={file}><span aria-hidden="true">{i ? "▱" : "▤"}</span>{file}</div>)}</div><div className="mc-next-step">{copy.portal.next} <span aria-hidden="true">→</span></div></div></div></div>}
            {story.id === "connect" && <div className="mc-workflow">{copy.workflow.map(([title, detail], i) => <div className="mc-workflow-step" key={title}><span aria-hidden="true">0{i+1}</span><div>{title}<small>{detail}</small></div></div>)}</div>}
            {story.id === "improve" && <div className="mc-booking"><div className="mc-booking-label">{copy.booking.label}</div><h3>{copy.booking.heading}</h3><div className="mc-booking-days">{copy.booking.periods.map((period, i) => <div className={`mc-booking-day${i === 1 ? " selected" : ""}`} key={period}>{period}<br/>{["09:00", "14:00", "17:00"][i]}</div>)}</div><div className="mc-booking-summary">{copy.booking.summary}</div></div>}
          </div>
          <div className="mc-example-bottom"><p>{story.note}</p><div aria-label={copy.includes}>{STORY_SERVICES[story.id].map(id => <Link key={id} href={localizePath(`/services#${id}`, locale)}>{SERVICES[locale].find(service => service.id === id)!.title} <span aria-hidden="true">↗</span></Link>)}</div></div>
        </div>)}
      </div>
    </div>
  </section>;
}
