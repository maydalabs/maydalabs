import type { Locale } from "@/lib/i18n";
import type { ServiceId } from "@/lib/services";
import { SERVICE_UI } from "@/lib/servicePages";

/** Schematic interfaces, never screenshots, client data or measured outcomes. */
export function ServiceVisual({ id, locale }: { id: ServiceId; locale: Locale }) {
  const c = SERVICE_UI[locale];
  return <figure className={`svc-visual svc-visual-${id}`}>
    <div className="svc-drawing" aria-hidden="true">
      {id === "websites" && <div className="svc-browser">
        <div className="svc-browser-bar"><i/><i/><i/><span>yourbusiness.com</span></div>
        <div className="svc-browser-body"><div className="svc-browser-heading"><span/>{c.diagram[0]}<br/><em>{c.diagram[1]}.</em></div><div className="svc-browser-grid"><i/><i/><i/></div><div className="svc-browser-action">{c.diagram[2]} <span>↗</span></div></div>
      </div>}
      {id === "software" && <div className="svc-workspace">
        <div className="svc-workspace-nav"><span className="svc-workspace-mark">⌘</span><i/><i/><i/></div>
        <div className="svc-workspace-main"><div className="svc-workspace-title">{c.portal[0]} <span>↗</span></div><div className="svc-workspace-tabs"><span>{c.portal[1]}</span><span>{c.portal[2]}</span></div><div className="svc-workspace-cards"><div><i/><b/><b/></div><div><i/><b/><b/></div></div><div className="svc-workspace-next"><span>✓</span>{c.portal[3]}<i/></div></div>
      </div>}
      {id === "automation" && <div className="svc-chain">{c.flow.map((label, i) => <div key={label} className={`svc-chain-node svc-chain-node-${i}`}><span>{["↳", "≋", "✓"][i]}</span><b>{label}</b></div>)}</div>}
      {id === "email" && <div className="svc-messages">{c.email.map((label, i) => <div key={label} className="svc-message"><span>{["✳", "↗", "↔"][i]}</span><div><b>{label}</b><i/></div><small>0{i + 1}</small></div>)}</div>}
      {id === "support" && <div className="svc-repair">{c.support.map((label, i) => <div key={label}><span>0{i + 1}</span><b>{label}</b><i>{i === 2 ? "✓" : "→"}</i></div>)}<div className="svc-repair-line"><i/><i/><i/></div></div>}
    </div>
    <figcaption>{c.sample}</figcaption>
  </figure>;
}
