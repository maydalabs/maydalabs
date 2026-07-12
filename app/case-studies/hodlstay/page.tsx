import Image from "next/image";
import Link from "next/link";
import { createPageMetadata } from "@/lib/metadata";
import { getIntroCallUrl } from "@/lib/marketingLinks";

export const metadata = createPageMetadata({
  title: "HodlStay case study",
  socialTitle: "HodlStay: a global stay marketplace · MaydaLabs",
  description:
    "How MaydaLabs evolved AirBTC into HodlStay, connecting marketplace discovery, host operations, availability, payments, migration, and handover.",
  path: "/case-studies/hodlstay",
});

const TRANSFORMATION = [
  {
    number: "01",
    label: "Reframe",
    title: "Move beyond the niche without erasing the roots.",
    copy: "AirBTC had a distinct community and a clear Bitcoin origin. The product direction evolved into HodlStay: a broader premium travel proposition with Bitcoin-friendly booking built into the experience rather than treated as the whole experience.",
  },
  {
    number: "02",
    label: "Rebuild",
    title: "Treat every side of the marketplace as one product.",
    copy: "Guest discovery, stay dossiers, host onboarding, calendars, booking requests, payment state, reviews, and internal operations were shaped as one connected system instead of a collection of isolated screens.",
  },
  {
    number: "03",
    label: "Transfer",
    title: "Build toward ownership, not dependence.",
    copy: "The engagement is a client product build prepared for handover on completion. Product decisions, operating logic, launch preparation, and documentation are structured so the client can own what comes next.",
  },
] as const;

const SYSTEMS = [
  {
    number: "01",
    title: "Guest discovery",
    copy: "Destination, date, guest, category, and inventory paths that lead into a credible stay decision.",
  },
  {
    number: "02",
    title: "Stay dossier",
    copy: "Property story, media, host context, availability, fiat and sats pricing, and booking entry in one surface.",
  },
  {
    number: "03",
    title: "Host operations",
    copy: "Onboarding, listings, calendars, booking responses, reviews, payouts, and the operational views behind them.",
  },
  {
    number: "04",
    title: "Booking and settlement",
    copy: "Availability checks, acceptance state, BTCPay checkout, verified webhooks, settlement, and payout records.",
  },
  {
    number: "05",
    title: "Inventory and migration",
    copy: "Native supply, eligible partner inventory, iCal blocks, and legacy records reconciled into the launch system.",
  },
] as const;

const GALLERY = [
  {
    number: "01",
    label: "Discovery",
    title: "A search surface that behaves like the front door to a marketplace.",
    copy: "Categories, dates, guests, filters, and live inventory are organized to make the next decision obvious without flattening every stay into the same template.",
    src: "/work/hodlstay-stays.png",
    alt: "HodlStay stay discovery and search interface",
  },
  {
    number: "02",
    label: "Stay dossier",
    title: "Enough context to move from interest to intent.",
    copy: "The property page connects story, imagery, host trust, pricing, availability, and booking entry while keeping Bitcoin pricing legible rather than ornamental.",
    src: "/work/hodlstay-listing.png",
    alt: "HodlStay property dossier and booking interface",
  },
  {
    number: "03",
    label: "Conference product",
    title: "A focused product path inside the wider platform.",
    copy: "Event accommodation creates a dedicated journey for attendees, organizers, and participating hosts without splitting the marketplace into a separate product.",
    src: "/work/hodlstay-conferences.png",
    alt: "HodlStay conference accommodation interface",
  },
] as const;

const PROOF = [
  {
    number: "01",
    title: "Unified inventory",
    copy: "One discovery layer can present native HodlStay supply alongside eligible HotelPlanner and Dtravel partner inventory.",
  },
  {
    number: "02",
    title: "Availability safety",
    copy: "Imported iCal blocks, manual host blocks, and internal bookings are checked together to reduce double-booking risk.",
  },
  {
    number: "03",
    title: "Bitcoin payment lifecycle",
    copy: "Host acceptance connects to BTCPay checkout, signed webhook verification, booking settlement, and a traceable payout record.",
  },
  {
    number: "04",
    title: "Operational migration",
    copy: "Legacy WordPress and founder spreadsheet records are reconciled into a structured launch pipeline with explicit exception handling.",
  },
] as const;

const CONTRIBUTION = [
  ["Product", "Strategy, information architecture, release shaping"],
  ["Experience", "Brand evolution, UX, interface system, responsive behavior"],
  ["Engineering", "Marketplace application, data, payments, partner integrations"],
  ["Operations", "Host and guest lifecycles, migration, launch preparation"],
  ["Engagement", "End-to-end client build, prepared for handover"],
] as const;

function Arrow() {
  return <span aria-hidden>↗</span>;
}

export default function HodlStayCaseStudyPage() {
  return (
    <div className="hodl-case">
      <section className="hodl-hero">
        <div className="hodl-shell hodl-hero-grid">
          <div className="hodl-hero-copy">
            <Link href="/case-studies" className="hodl-back-link">
              <span aria-hidden>←</span> Selected work
            </Link>
            <p className="studio-kicker">Flagship 01 / Client product build</p>
            <h1>
              From AirBTC to a stay worth <em>holding onto.</em>
            </h1>
            <p className="hodl-hero-lead">
              A Bitcoin-native travel idea evolved into a broader global marketplace, connecting the guest experience with the operational system required to run it.
            </p>
            <div className="hodl-hero-actions">
              <a href="https://hodlstay.com" target="_blank" rel="noopener noreferrer" className="studio-button">
                Visit live product <Arrow />
              </a>
              <a href="#story" className="studio-text-link">
                Read the build story <span aria-hidden>↓</span>
              </a>
            </div>
          </div>

          <div className="hodl-hero-orbit" aria-hidden="true">
            <div className="hodl-orbit-ring hodl-orbit-ring-one" />
            <div className="hodl-orbit-ring hodl-orbit-ring-two" />
            <span className="hodl-orbit-label hodl-orbit-label-one">GUEST</span>
            <span className="hodl-orbit-label hodl-orbit-label-two">HOST</span>
            <span className="hodl-orbit-label hodl-orbit-label-three">OPS</span>
          </div>

          <div className="hodl-hero-screen">
            <div className="project-browser-chrome">
              <div><i /><i /><i /></div>
              <span>hodlstay.com</span>
              <b>Client project · Live</b>
            </div>
            <Image
              src="/work/hodlstay-home.png"
              alt="HodlStay global booking marketplace homepage"
              width={1270}
              height={714}
              priority
              sizes="(max-width: 900px) 100vw, 78vw"
            />
          </div>

          <div className="hodl-engagement-rail" aria-label="Engagement summary">
            <div><span>Engagement</span><strong>End-to-end client build</strong></div>
            <div><span>Status</span><strong>Live · Active delivery</strong></div>
            <div><span>Scope</span><strong>Product · Brand · Build · Launch</strong></div>
            <div><span>Ownership</span><strong>Prepared for client handover</strong></div>
          </div>
        </div>
      </section>

      <section id="story" className="hodl-thesis">
        <div className="hodl-shell hodl-thesis-grid">
          <p className="studio-kicker">The premise / More than a booking page</p>
          <h2>A marketplace is the customer experience and the machinery behind it.</h2>
          <p>
            The visible product only works when inventory, trust, availability, payment state, partner supply, and operator decisions agree. HodlStay was shaped around that whole system.
          </p>
        </div>
      </section>

      <section className="hodl-transformation">
        <div className="hodl-shell hodl-transformation-layout">
          <div className="hodl-sticky-heading">
            <p className="studio-kicker">AirBTC → HodlStay</p>
            <h2>Change the frame.<br /><em>Keep the signal.</em></h2>
          </div>
          <div className="hodl-transformation-list">
            {TRANSFORMATION.map((step) => (
              <article key={step.number}>
                <div><span>{step.number}</span><p>{step.label}</p></div>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="hodl-system">
        <div className="hodl-shell">
          <div className="hodl-system-heading">
            <p className="studio-kicker">Product architecture / One operating view</p>
            <h2>One product.<br /><em>Five connected systems.</em></h2>
            <p>Every surface is designed around the state changes and responsibilities on both sides of the marketplace.</p>
          </div>

          <div className="hodl-system-map" aria-hidden="true">
            <div className="hodl-system-core">
              <span>HODLSTAY</span>
              <strong>MARKETPLACE CORE</strong>
              <i />
            </div>
            {SYSTEMS.map((system) => (
              <div key={system.number} className={`hodl-system-node hodl-system-node-${system.number}`}>
                <span>{system.number}</span>
                <strong>{system.title}</strong>
              </div>
            ))}
          </div>

          <div className="hodl-system-list">
            {SYSTEMS.map((system) => (
              <article key={system.number}>
                <span>{system.number}</span>
                <h3>{system.title}</h3>
                <p>{system.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="hodl-gallery">
        <div className="hodl-shell">
          <div className="hodl-gallery-heading">
            <p className="studio-kicker">Inside the product / Real surfaces</p>
            <h2>The interface is where the systems become understandable.</h2>
          </div>

          <div className="hodl-gallery-list">
            {GALLERY.map((frame) => (
              <figure key={frame.number}>
                <div className="hodl-gallery-copy">
                  <div><span>{frame.number}</span><p>{frame.label}</p></div>
                  <h3>{frame.title}</h3>
                  <p>{frame.copy}</p>
                </div>
                <div className="hodl-gallery-frame">
                  <div className="project-browser-chrome">
                    <div><i /><i /><i /></div>
                    <span>hodlstay.com</span>
                    <b>{frame.label}</b>
                  </div>
                  <Image src={frame.src} alt={frame.alt} width={1270} height={714} sizes="(max-width: 900px) 100vw, 74vw" />
                </div>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="hodl-proof">
        <div className="hodl-shell">
          <div className="hodl-proof-heading">
            <p className="studio-kicker">Depth over decoration</p>
            <h2>Four hard problems, connected.</h2>
          </div>
          <div className="hodl-proof-grid">
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

      <section className="hodl-contribution">
        <div className="hodl-shell hodl-contribution-layout">
          <div>
            <p className="studio-kicker">MaydaLabs contribution</p>
            <h2>One accountable build partner across the product.</h2>
            <p>This is client work, not a MaydaLabs-owned venture. The role is to shape, build, prepare, and hand over a product the client can operate and continue.</p>
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

      <section className="studio-final-cta hodl-final-cta">
        <div className="studio-availability"><span /> Open for new client work</div>
        <p className="studio-kicker">Have a product with this much complexity?</p>
        <h2>Bring the messy system.<br /><em>We will find the signal.</em></h2>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={getIntroCallUrl("hodlstay_case_bottom")} target="_blank" rel="noopener noreferrer" className="studio-button studio-button-light">
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
