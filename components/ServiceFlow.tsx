import type { Locale } from "@/lib/i18n";
import type { ServiceId } from "@/lib/services";
import { SERVICE_FLOWS, SERVICE_FLOW_UI } from "@/lib/serviceFlow";
import { SERVICE_DIAGRAMS } from "@/lib/serviceDiagrams";
import "@/app/service-flow.css";

type DiagramProps = { locale: Locale };

function SoftwareArchitecture({ locale }: DiagramProps) {
  const copy = SERVICE_DIAGRAMS[locale].software;
  return <div className="sf-architecture" data-diagram="product-architecture">
    <p className="sf-model-title">{copy.title}</p>
    <ol className="sf-layers">{copy.layers.map(([title, detail], index) => <li key={title}>
      <span className="sf-layer-index" aria-hidden="true">0{index + 1}</span>
      <div><strong>{title}</strong><p>{detail}</p></div>
      <span className="sf-layer-glyph" aria-hidden="true">{["▤", "{ }", "≡"][index]}</span>
    </li>)}</ol>
    <p className="sf-model-note">{copy.review}</p>
  </div>;
}

function AutomationBranch({ locale }: DiagramProps) {
  const copy = SERVICE_DIAGRAMS[locale].automation;
  return <div className="sf-branch" data-diagram="approval-branch">
    <div className="sf-trigger"><span className="sf-dot" aria-hidden="true"/><div><strong>{copy.trigger[0]}</strong><p>{copy.trigger[1]}</p></div></div>
    <span className="sf-connector" aria-hidden="true">↓</span>
    <div className="sf-processor"><span aria-hidden="true">⌘</span><div><strong>{copy.process[0]}</strong><p>{copy.process[1]}</p></div></div>
    <div className="sf-branch-paths" aria-hidden="true"><span/><span/></div>
    <div className="sf-branches">
      <div className="sf-approved"><span className="sf-node-mark" aria-hidden="true">✓</span><strong>{copy.approved[0]}</strong><p>{copy.approved[1]}</p></div>
      <div className="sf-exception"><span className="sf-node-mark" aria-hidden="true">Ⅱ</span><strong>{copy.exception[0]}</strong><p>{copy.exception[1]}</p></div>
    </div>
    <p className="sf-return"><span aria-hidden="true">↳</span> {copy.retry}</p>
  </div>;
}

function ResponsiveJourney({ locale }: DiagramProps) {
  const copy = SERVICE_DIAGRAMS[locale].websites;
  return <div className="sf-responsive" data-diagram="responsive-journey">
    <div className="sf-devices">
      <div className="sf-browser">
        <div className="sf-browser-bar"><span aria-hidden="true">● ● ●</span>{copy.page}</div>
        <div className="sf-page-content"><strong>{copy.headline}</strong><div className="sf-content-lines" aria-hidden="true"><i/><i/></div><span className="sf-page-action">{copy.action}<span aria-hidden="true">↗</span></span></div>
      </div>
      <div className="sf-phone" aria-hidden="true"><div className="sf-phone-speaker"/><span>{copy.phone}</span><div className="sf-phone-content"><i/><i/><i/></div><div className="sf-phone-action">↗</div></div>
    </div>
    <ol className="sf-journey-steps">{copy.steps.map((step, index) => <li key={step}><span aria-hidden="true">0{index + 1}</span>{step}</li>)}</ol>
  </div>;
}

function EmailTimeline({ locale }: DiagramProps) {
  const copy = SERVICE_DIAGRAMS[locale].email;
  return <div className="sf-lifecycle" data-diagram="customer-timeline">
    <p className="sf-consent"><span aria-hidden="true">◇</span>{copy.consent}</p>
    <ol className="sf-timeline">{copy.stages.map(([title, detail], index) => <li key={title}>
      <span className="sf-timeline-point" aria-hidden="true">0{index + 1}</span>
      <div><strong>{title}</strong><p>{detail}</p></div>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>
    </li>)}</ol>
    <p className="sf-exit"><span aria-hidden="true">↳</span>{copy.exit}</p>
  </div>;
}

function RepairLoop({ locale }: DiagramProps) {
  const copy = SERVICE_DIAGRAMS[locale].support;
  return <div className="sf-repair" data-diagram="diagnosis-repair">
    <div className="sf-diagnosis"><div><span className="sf-issue-mark" aria-hidden="true">!</span><strong>{copy.issue[0]}</strong><p>{copy.issue[1]}</p></div><span className="sf-trace" aria-hidden="true">↓</span><div><strong>{copy.cause[0]}</strong><p>{copy.cause[1]}</p></div></div>
    <div className="sf-patch"><div className="sf-patch-title"><span aria-hidden="true">− +</span><strong>{copy.patch}</strong></div><div className="sf-code-change" aria-hidden="true"><i/><i/><i/></div><ul>{copy.checks.map(check => <li key={check}><span aria-hidden="true">◇</span>{check}</li>)}</ul></div>
    <p className="sf-repair-loop"><span aria-hidden="true">↻</span>{copy.loop}</p>
  </div>;
}

const DIAGRAMS = { software: SoftwareArchitecture, automation: AutomationBranch, websites: ResponsiveJourney, email: EmailTimeline, support: RepairLoop } satisfies Record<ServiceId, (props: DiagramProps) => React.ReactNode>;

/** Five distinct server-rendered models; motion never carries information. */
export function ServiceFlow({ id, locale }: { id: ServiceId; locale: Locale }) {
  const flow = SERVICE_FLOWS[locale][id];
  const ui = SERVICE_FLOW_UI[locale];
  const Diagram = DIAGRAMS[id];
  return <figure className={`sf sf-${id}`} aria-labelledby={`flow-${id}`}>
    <figcaption id={`flow-${id}`} className="sf-heading">{ui.heading}<span aria-hidden="true">↗</span></figcaption>
    <Diagram locale={locale}/>
    <div className="sf-review"><span aria-hidden="true">◇</span>{flow.review}</div>
    <div className="sf-delivery"><p>{ui.handover}</p><strong>{flow.delivery}</strong></div>
    <p className="sf-detail">{flow.detail}</p>
  </figure>;
}
