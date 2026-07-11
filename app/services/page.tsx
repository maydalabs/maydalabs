import Link from "next/link";
import { createPageMetadata } from "@/lib/metadata";
import { getIntroCallUrl } from "@/lib/marketingLinks";

export const metadata = createPageMetadata({
  title: "Services",
  socialTitle: "Product, commerce, and growth systems · MaydaLabs",
  description:
    "MaydaLabs connects product strategy, software delivery, commerce, and growth systems for ambitious founders.",
  path: "/services",
});

const SERVICES = [
  {
    id: "product-builds",
    number: "01",
    eyebrow: "Zero to one / Rebuilds",
    title: "Build the product, not just the screens.",
    lead: "We turn an ambitious idea, an incomplete product, or a tangled operation into software people can understand and use.",
    fit: [
      "A new product needs its first credible release",
      "An existing build has outgrown its foundations",
      "A marketplace needs both customer and operator journeys",
    ],
    outputs: [
      "Product strategy and release scope",
      "UX, interface, and brand system",
      "Web or mobile application delivery",
      "Payments, data, and third-party integrations",
      "QA, launch preparation, and handover",
    ],
    surface: "services_product",
    tone: "dark",
  },
  {
    id: "commerce",
    number: "02",
    eyebrow: "Shopify / Custom commerce",
    title: "Turn the storefront into a system.",
    lead: "The best commerce work connects the brand people see with the operational machinery they never should have to think about.",
    fit: [
      "A template store no longer reflects the brand",
      "Purchase, subscription, or account flows create friction",
      "Commerce operations are split across disconnected tools",
    ],
    outputs: [
      "Shopify theme and storefront builds",
      "Custom commerce experiences",
      "Subscriptions and customer accounts",
      "Checkout and conversion architecture",
      "Operational integrations and automation",
    ],
    surface: "services_commerce",
    tone: "light",
  },
  {
    id: "growth-systems",
    number: "03",
    eyebrow: "Launch / Measurement / Lifecycle",
    title: "Make launch the start, not the finish.",
    lead: "We build the measurement, messaging, and lifecycle loops that help a shipped product learn what to do next.",
    fit: [
      "A product is shipping without a clear launch system",
      "Traffic arrives but the customer journey leaks intent",
      "Content, lifecycle, and analytics lack one operating view",
    ],
    outputs: [
      "Launch strategy and campaign surfaces",
      "Landing pages and conversion journeys",
      "Analytics and decision dashboards",
      "Lifecycle messaging and automation",
      "Content systems and iteration plans",
    ],
    surface: "services_growth",
    tone: "signal",
  },
] as const;

const STANDARDS = [
  {
    number: "01",
    title: "One decision loop",
    copy: "Product context stays connected to design and engineering instead of being translated through account layers.",
  },
  {
    number: "02",
    title: "Working releases",
    copy: "Decisions happen against the real product in tight cycles, not against a presentation that disappears after kickoff.",
  },
  {
    number: "03",
    title: "Built for ownership",
    copy: "The system, documentation, and handover are prepared so the product can keep moving after the engagement.",
  },
  {
    number: "04",
    title: "Measured momentum",
    copy: "Launch instrumentation and customer signals shape the next highest-leverage move.",
  },
];

function Arrow() {
  return <span aria-hidden>↗</span>;
}

export default function ServicesPage() {
  return (
    <div className="services-page">
      <section className="services-hero">
        <div>
          <p className="studio-kicker">Capabilities / Connected by design</p>
          <h1>One studio.<br /><em>Three ways to move.</em></h1>
        </div>

        <div className="services-hero-aside">
          <p>
            Start with the product, the storefront, or the growth problem. We connect the other layers when the job requires them.
          </p>
          <div className="services-system-map" aria-hidden="true">
            <span>PRODUCT</span><i />
            <span>COMMERCE</span><i />
            <span>GROWTH</span><b />
          </div>
        </div>
      </section>

      <section className="service-detail-stack" aria-label="MaydaLabs services">
        {SERVICES.map((service) => (
          <article
            id={service.id}
            key={service.id}
            className="service-detail scroll-mt-24"
            data-tone={service.tone}
            data-service-number={service.number}
          >
            <div className="service-detail-index">
              <span>{service.number}</span>
              <p>{service.eyebrow}</p>
            </div>

            <div className="service-detail-main">
              <div>
                <h2>{service.title}</h2>
                <p className="service-detail-lead">{service.lead}</p>
              </div>

              <div className="service-detail-lists">
                <section>
                  <p>Strong fit when</p>
                  <ul>{service.fit.map((item) => <li key={item}>{item}</li>)}</ul>
                </section>
                <section>
                  <p>What we can connect</p>
                  <ul>{service.outputs.map((item) => <li key={item}>{item}</li>)}</ul>
                </section>
              </div>
            </div>

            <Link
              href={getIntroCallUrl(service.surface)}
              target="_blank"
              rel="noopener noreferrer"
              className={service.tone === "dark" ? "studio-button" : "studio-button studio-button-light"}
            >
              Discuss this kind of project <Arrow />
            </Link>
          </article>
        ))}
      </section>

      <section className="services-standards">
        <div className="services-standards-heading">
          <p className="studio-kicker">Every engagement / Same operating standard</p>
          <h2>The shape changes.<br /><em>The rigor does not.</em></h2>
        </div>
        <div className="services-standards-grid">
          {STANDARDS.map((standard) => (
            <article key={standard.number}>
              <span>{standard.number}</span>
              <h3>{standard.title}</h3>
              <p>{standard.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="studio-final-cta">
        <div className="studio-availability"><span /> Open for new client work</div>
        <p className="studio-kicker">Scope follows understanding</p>
        <h2>Start with the problem.<br /><em>We’ll shape the engagement.</em></h2>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={getIntroCallUrl("services_bottom")}
            target="_blank"
            rel="noopener noreferrer"
            className="studio-button studio-button-light"
          >
            Book a project call <Arrow />
          </Link>
          <Link href="/case-studies" className="studio-button studio-button-outline-light">
            See the work
          </Link>
        </div>
        <p className="studio-final-note">No fixed packages or public rate card. Scope and commercial terms follow the first conversation.</p>
      </section>
    </div>
  );
}
