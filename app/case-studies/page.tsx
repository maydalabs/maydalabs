import Image from "next/image";
import Link from "next/link";
import { getIntroCallUrl } from "@/lib/marketingLinks";
import { createPageMetadata } from "@/lib/metadata";

type GalleryItem = {
  src: string;
  alt: string;
  label: string;
  detail: string;
};

type ProofItem = {
  number: string;
  title: string;
  copy: string;
};

type CaseStudy = {
  id: string;
  number: string;
  name: string;
  category: string;
  title: string;
  summary: string;
  engagement?: string;
  challenge: string;
  built: string[];
  stack: string[];
  image: string;
  width: number;
  height: number;
  alt: string;
  status: string;
  domain: string;
  url: string;
  gallery: GalleryItem[];
  proof: ProofItem[];
};

export const metadata = createPageMetadata({
  title: "Selected work",
  socialTitle: "Selected product work · MaydaLabs",
  description:
    "Selected MaydaLabs product work, including HodlStay and Satoshi Gazette.",
  path: "/case-studies",
});

const CASES: CaseStudy[] = [
  {
    id: "hodlstay",
    number: "01",
    name: "HodlStay",
    category: "Marketplace · Travel · Bitcoin",
    title: "A global stay marketplace, rebuilt around a sharper product idea.",
    summary:
      "HodlStay evolved from AirBTC into a premium travel product with Bitcoin-friendly booking built in. The work spans public discovery, host operations, guest journeys, legacy-data migration, partner inventory, payments, and the brand system around it.",
    engagement: "End-to-end client product build, prepared for handover on completion.",
    challenge:
      "Turn a promising niche platform into a credible, scalable marketplace without losing the community and Bitcoin roots that made it distinct.",
    built: [
      "Unified marketplace discovery and stay dossiers",
      "Host onboarding, listing, calendar, and payout operations",
      "Booking, availability, review, and payment lifecycles",
      "AirBTC to HodlStay product and brand evolution",
      "Conference accommodation and partner inventory flows",
    ],
    stack: ["Next.js", "React", "Supabase", "BTCPay", "Resend", "Vercel"],
    image: "/work/hodlstay-home.png",
    width: 1270,
    height: 714,
    alt: "HodlStay global booking marketplace",
    status: "Client project · Live",
    domain: "hodlstay.com",
    url: "https://hodlstay.com",
    gallery: [
      {
        src: "/work/hodlstay-stays.png",
        alt: "HodlStay stay discovery and search interface",
        label: "Discovery",
        detail: "Category-led search, dates, guests, filters, and live inventory.",
      },
      {
        src: "/work/hodlstay-listing.png",
        alt: "HodlStay property dossier and booking interface",
        label: "Stay dossier",
        detail: "Property story, media, host context, fiat and sats pricing, and booking entry.",
      },
      {
        src: "/work/hodlstay-conferences.png",
        alt: "HodlStay conference accommodation interface",
        label: "Conference product",
        detail: "Dedicated accommodation paths for events, attendees, organizers, and hosts.",
      },
    ],
    proof: [
      {
        number: "01",
        title: "Unified discovery",
        copy: "One search layer can present native HodlStay inventory alongside eligible HotelPlanner and Dtravel partner supply.",
      },
      {
        number: "02",
        title: "Availability safety",
        copy: "Imported iCal blocks, manual host blocks, and internal bookings are checked together to reduce double-booking risk.",
      },
      {
        number: "03",
        title: "Bitcoin payment lifecycle",
        copy: "Host acceptance leads into BTCPay checkout, signed webhook verification, booking settlement, and a traceable payout record.",
      },
      {
        number: "04",
        title: "Operational migration",
        copy: "Legacy WordPress and founder spreadsheet records are reconciled into a structured launch pipeline with explicit exception handling.",
      },
    ],
  },
  {
    id: "satoshi-gazette",
    number: "02",
    name: "Satoshi Gazette",
    category: "Media · Data · AI-assisted operations",
    title: "A Bitcoin newsroom designed as an information product.",
    summary:
      "Satoshi Gazette combines a live market layer, structured editorial desks, long-form reporting, wire updates, and briefings. The live product is in an active build phase as the newsroom and publishing workflows are brought to showcase level.",
    challenge:
      "Build a publication that feels authoritative and editorial while the operating system behind it stays fast, structured, and ready for responsible AI assistance.",
    built: [
      "Editorial information architecture and visual system",
      "Market, mining, policy, wire, and briefing surfaces",
      "Publishing workflows and internal newsroom tooling",
      "Live Bitcoin market and network context",
      "AI-assisted research and production foundations",
    ],
    stack: ["Next.js", "React", "Supabase", "Editorial CMS", "Market data", "AI workflows"],
    image: "/work/satoshi-gazette-live-home.png",
    width: 1440,
    height: 900,
    alt: "Satoshi Gazette Bitcoin newsroom",
    status: "Live · Active build",
    domain: "satoshigazette.org",
    url: "https://satoshigazette.org",
    gallery: [],
    proof: [],
  },
];

function ExternalArrow() {
  return <span aria-hidden>↗</span>;
}

export default function CaseStudiesPage() {
  return (
    <div className="studio-inner-page">
      <section className="studio-inner-hero">
        <p className="studio-kicker">Selected work / Built, not rendered</p>
        <h1>Two products.<br /><em>One point of view.</em></h1>
        <p>
          The strongest proof is software you can open. These projects show how MaydaLabs moves between consumer experience, complex operations, editorial systems, and growth.
        </p>
      </section>

      {CASES.map((item) => (
        <article id={item.id} key={item.id} className="case-detail scroll-mt-28">
          <div className="case-detail-heading">
            <p>{item.number} / {item.name}</p>
            <span>{item.category}</span>
          </div>
          <div className="case-detail-title">
            <h2>{item.title}</h2>
            <div>
              <p>{item.summary}</p>
              {item.engagement ? (
                <p className="case-detail-engagement">
                  <span>Engagement</span>
                  {item.engagement}
                </p>
              ) : null}
              <div className="case-detail-links">
                <Link href={`/case-studies/${item.id}`} className="studio-text-link">
                    Open full case study <ExternalArrow />
                </Link>
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="studio-text-link">
                  Visit {item.domain} <ExternalArrow />
                </a>
              </div>
            </div>
          </div>

          <div className="case-detail-screen">
            <div className="project-browser-chrome">
              <div><i /><i /><i /></div>
              <span>{item.domain}</span>
              <b>{item.status}</b>
            </div>
            <Image
              src={item.image}
              alt={item.alt}
              width={item.width}
              height={item.height}
              sizes="(max-width: 900px) 100vw, 90vw"
            />
          </div>

          <div className="case-detail-grid">
            <section>
              <p className="studio-kicker">The challenge</p>
              <p>{item.challenge}</p>
            </section>
            <section>
              <p className="studio-kicker">The system we built</p>
              <ul>{item.built.map((entry) => <li key={entry}>{entry}</li>)}</ul>
            </section>
            <section>
              <p className="studio-kicker">Core stack</p>
              <div>{item.stack.map((entry) => <span key={entry}>{entry}</span>)}</div>
            </section>
          </div>

          {item.gallery.length > 0 ? (
            <section className="case-gallery" aria-label={`${item.name} product gallery`}>
              <div className="case-subheading">
                <p className="studio-kicker">Inside the product</p>
                <h3>A marketplace is more than its landing page.</h3>
              </div>
              <div className="case-gallery-grid">
                {item.gallery.map((frame) => (
                  <figure key={frame.src}>
                    <div className="case-gallery-frame">
                      <Image src={frame.src} alt={frame.alt} width={1270} height={714} sizes="(max-width: 900px) 100vw, 72vw" />
                    </div>
                    <figcaption><strong>{frame.label}</strong><span>{frame.detail}</span></figcaption>
                  </figure>
                ))}
              </div>
            </section>
          ) : null}

          {item.proof.length > 0 ? (
            <section className="case-proof">
              <div className="case-subheading">
                <p className="studio-kicker">The system behind the screen</p>
                <h3>Four hard problems, connected.</h3>
              </div>
              <div className="case-proof-grid">
                {item.proof.map((proof) => (
                  <article key={proof.number}>
                    <span>{proof.number}</span>
                    <h4>{proof.title}</h4>
                    <p>{proof.copy}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </article>
      ))}

      <section className="studio-inner-cta">
        <p className="studio-kicker">Open for new client work</p>
        <h2>Let’s build the proof.</h2>
        <Link href={getIntroCallUrl("work_bottom")} target="_blank" rel="noopener noreferrer" className="studio-button">
          Start a project <ExternalArrow />
        </Link>
      </section>
    </div>
  );
}
