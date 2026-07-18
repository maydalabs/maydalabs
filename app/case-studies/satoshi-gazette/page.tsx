import Image from "next/image";
import Link from "next/link";
import { createPageMetadata } from "@/lib/metadata";
import { getIntroCallUrl } from "@/lib/marketingLinks";

export const metadata = createPageMetadata({
  title: "Satoshi Gazette case study",
  socialTitle: "Satoshi Gazette: a newsroom operating system · MaydaLabs",
  description:
    "How MaydaLabs is building Satoshi Gazette as a Bitcoin newsroom product, connecting public desks, reviewed evidence, editorial workflows, retrieval, and distribution.",
  path: "/case-studies/satoshi-gazette",
});

const LAYERS = [
  {
    number: "01",
    label: "Public signal",
    title: "One publication, multiple reading speeds.",
    copy: "News, Wire, briefings, market context, mining, macro, and policy give readers a fast scan or a deeper route through the same editorial world.",
    items: ["Desks", "Wire", "Briefings", "Market context"],
  },
  {
    number: "02",
    label: "Editorial spine",
    title: "A newsroom needs state, not scattered documents.",
    copy: "Submissions, candidates, evidence review, editing, and publication move through an explicit lifecycle built for operator control.",
    items: ["Intake", "Candidates", "Source review", "Publish"],
  },
  {
    number: "03",
    label: "Knowledge + distribution",
    title: "Research should remain traceable after publishing.",
    copy: "Role-aware source links support citation-first retrieval, while distribution drafts and review queues extend the story without bypassing editorial judgment.",
    items: ["Evidence", "Ask retrieval", "Drafts", "Review queue"],
  },
] as const;

const PIPELINE = [
  ["01", "Submission", "Raw signal enters"],
  ["02", "Candidate", "Editorial value assessed"],
  ["03", "Evidence", "Sources reviewed and linked"],
  ["04", "Publish", "Story enters the newsroom"],
  ["05", "Distribute", "Platform drafts enter review"],
] as const;

const SURFACES = [
  {
    number: "01",
    label: "Front page",
    title: "One front page, multiple signal layers.",
    copy: "The masthead connects live market context, editorial desks, the Wire, briefings, and major stories without turning the product into a dashboard.",
    src: "/work/satoshi-gazette-live-home.png",
    alt: "Satoshi Gazette live homepage with market context and editorial desks",
  },
  {
    number: "02",
    label: "The Wire",
    title: "Fast reporting with structured source and time.",
    copy: "Wire entries are designed for high-signal updates: source identity and source time are part of the content model, not loose text added after publication.",
    src: "/work/satoshi-gazette-live-wire.png",
    alt: "Satoshi Gazette Wire product surface",
  },
  {
    number: "03",
    label: "Macro desk",
    title: "New desks inherit the same newsroom system.",
    copy: "The Macro desk demonstrates how the publication can expand its editorial coverage without creating a separate visual or operational product each time.",
    src: "/work/satoshi-gazette-live-macro.png",
    alt: "Satoshi Gazette Macro editorial desk",
  },
] as const;

const PROOF = [
  {
    number: "E1",
    title: "Evidence has a role",
    copy: "Reviewed source documents can be connected as primary, supporting, background, or counterpoint evidence instead of becoming an undifferentiated link pile.",
  },
  {
    number: "E2",
    title: "Publishing has a lifecycle",
    copy: "Submission, candidate, editorial review, publishing, and distribution are separate operating states with clear human decision points.",
  },
  {
    number: "E3",
    title: "Retrieval has guardrails",
    copy: "Ask Satoshi is Bitcoin-only, citation-led, and designed to fall back when evidence is weak rather than improvise certainty.",
  },
  {
    number: "E4",
    title: "Public and internal stay separate",
    copy: "The reading experience remains editorial while newsroom controls, source review, publishing, and distribution tooling stay behind the public surface.",
  },
] as const;

const CONTRIBUTION = [
  ["Product", "Strategy, system architecture, release shaping"],
  ["Editorial UX", "Information hierarchy, desks, story and wire surfaces"],
  ["Engineering", "Application, data models, APIs, publishing workflows"],
  ["Knowledge", "Reviewed sources, citation roles, retrieval foundations"],
  ["Operations", "Intake, editorial control, publishing, distribution review"],
] as const;

function Arrow() {
  return <span aria-hidden>↗</span>;
}

export default function SatoshiGazetteCaseStudyPage() {
  return (
    <div className="sg-case">
      <section className="sg-hero">
        <div className="sg-shell sg-hero-grid">
          <div className="sg-hero-copy">
            <Link href="/case-studies" className="sg-back-link">
              <span aria-hidden>←</span> Selected work
            </Link>
            <p className="studio-kicker">Flagship 02 / Active product build</p>
            <h1>
              Building a newsroom as a <em>product.</em>
            </h1>
            <p className="sg-hero-lead">
              Satoshi Gazette connects a public Bitcoin publication to the evidence, editorial state, retrieval, and distribution systems required to operate it with discipline.
            </p>
            <div className="sg-hero-actions">
              <a href="https://satoshigazette.org" target="_blank" rel="noopener noreferrer" className="studio-button">
                Visit live product <Arrow />
              </a>
              <a href="#system" className="studio-text-link">
                Inspect the system <span aria-hidden>↓</span>
              </a>
            </div>
          </div>

          <div className="sg-hero-identity" aria-hidden="true">
            <span>EC / 1</span>
            <Image src="/work/satoshi-gazette-ec1-mark.svg" alt="" width={64} height={64} />
            <p>BITCOIN-ONLY<br />NEWSROOM SYSTEM</p>
          </div>

          <div className="sg-hero-screen">
            <div className="project-browser-chrome">
              <div><i /><i /><i /></div>
              <span>satoshigazette.org</span>
              <b>Live · Active build</b>
            </div>
            <Image
              src="/work/satoshi-gazette-live-home.png"
              alt="Satoshi Gazette live Bitcoin newsroom homepage"
              width={1440}
              height={900}
              priority
              loading="eager"
              sizes="(max-width: 900px) 100vw, 82vw"
            />
          </div>

          <div className="sg-status-rail" aria-label="Product summary">
            <div><span>Product</span><strong>Bitcoin-only newsroom</strong></div>
            <div><span>Status</span><strong>Live · Active build</strong></div>
            <div><span>Scope</span><strong>Product · Editorial UX · Data · Operations</strong></div>
            <div><span>Evidence model</span><strong>Reviewed · Role-aware · Retrievable</strong></div>
          </div>
        </div>
      </section>

      <section className="sg-thesis">
        <div className="sg-shell sg-thesis-grid">
          <p className="studio-kicker">The premise / Publication is the surface</p>
          <h2>Not a publication skin.<br /><em>A newsroom operating system.</em></h2>
          <p>
            Editorial authority does not come from typography alone. The product has to preserve evidence, make state visible to operators, separate public reading from internal control, and keep human judgment in the consequential parts of the workflow.
          </p>
        </div>
      </section>

      <section id="system" className="sg-system">
        <div className="sg-shell">
          <div className="sg-section-heading">
            <div>
              <p className="studio-kicker">System architecture / Three connected layers</p>
              <h2>The reader sees clarity.<br /><em>The newsroom sees control.</em></h2>
            </div>
            <p>Each layer has a different job. Together, they let the product move quickly without flattening editorial work into content automation.</p>
          </div>

          <div className="sg-layer-stack">
            {LAYERS.map((layer) => (
              <article key={layer.number}>
                <div className="sg-layer-index">
                  <span>{layer.number}</span>
                  <p>{layer.label}</p>
                </div>
                <div className="sg-layer-copy">
                  <h3>{layer.title}</h3>
                  <p>{layer.copy}</p>
                </div>
                <div className="sg-layer-items">
                  {layer.items.map((item) => <span key={item}>{item}</span>)}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sg-pipeline">
        <div className="sg-shell">
          <div className="sg-pipeline-heading">
            <p className="studio-kicker">Editorial lifecycle / Signal becomes record</p>
            <h2>Every handoff is a state change.</h2>
          </div>
          <div className="sg-pipeline-track" aria-label="Satoshi Gazette editorial workflow">
            {PIPELINE.map(([number, title, detail]) => (
              <div key={number}>
                <span>{number}</span>
                <i aria-hidden="true" />
                <strong>{title}</strong>
                <p>{detail}</p>
              </div>
            ))}
          </div>
          <p className="sg-pipeline-note">HUMAN REVIEW REMAINS IN THE LOOP</p>
        </div>
      </section>

      <section className="sg-surfaces">
        <div className="sg-shell">
          <div className="sg-section-heading">
            <div>
              <p className="studio-kicker">Live product / Current surfaces</p>
              <h2>A publication that behaves like one system.</h2>
            </div>
            <p>These frames show the live product during its active newsroom build. They are working surfaces, not concept mockups.</p>
          </div>

          <div className="sg-surface-list">
            {SURFACES.map((surface) => (
              <figure key={surface.number}>
                <figcaption>
                  <div><span>{surface.number}</span><p>{surface.label}</p></div>
                  <h3>{surface.title}</h3>
                  <p>{surface.copy}</p>
                </figcaption>
                <div className="sg-surface-frame">
                  <div className="project-browser-chrome">
                    <div><i /><i /><i /></div>
                    <span>satoshigazette.org</span>
                    <b>{surface.label}</b>
                  </div>
                  <Image src={surface.src} alt={surface.alt} width={1440} height={900} sizes="(max-width: 900px) 100vw, 78vw" />
                </div>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="sg-proof">
        <div className="sg-shell">
          <div className="sg-proof-heading">
            <p className="studio-kicker">Trust architecture / Product truths</p>
            <h2>Four decisions that keep the system honest.</h2>
          </div>
          <div className="sg-proof-grid">
            {PROOF.map((item) => (
              <article key={item.number}>
                <span>{item.number}</span>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sg-contribution">
        <div className="sg-shell sg-contribution-layout">
          <div>
            <p className="studio-kicker">MaydaLabs contribution</p>
            <h2>Brand, newsroom, and software shaped as one product.</h2>
            <p>The work connects editorial intent to the technical and operational systems that make it repeatable. AI accelerates research and production where useful; editorial responsibility stays human.</p>
          </div>
          <dl>
            {CONTRIBUTION.map(([term, detail]) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="studio-final-cta sg-final-cta">
        <div className="studio-availability"><span /> Open for new client work</div>
        <p className="studio-kicker">Building an information-heavy product?</p>
        <h2>Bring the complexity.<br /><em>We will design the system.</em></h2>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={getIntroCallUrl("satoshi_gazette_case_bottom")} target="_blank" rel="noopener noreferrer" className="studio-button studio-button-light">
            Start a project <Arrow />
          </Link>
          <Link href="/services" className="studio-button studio-button-outline-light">
            Explore services
          </Link>
        </div>
      </section>
    </div>
  );
}
