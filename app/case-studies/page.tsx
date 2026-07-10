import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getIntroCallUrl } from "@/lib/marketingLinks";

export const metadata: Metadata = {
  title: "Selected work",
  description:
    "Selected MaydaLabs product work, including HodlStay and Satoshi Gazette.",
};

const CASES = [
  {
    id: "hodlstay",
    number: "01",
    name: "HodlStay",
    category: "Marketplace · Travel · Bitcoin",
    title: "A global stay marketplace, rebuilt around a sharper product idea.",
    summary:
      "HodlStay evolved from AirBTC into a premium travel product with Bitcoin-friendly booking built in. The work spans the public marketplace, host operations, guest journeys, data migration, payments, and the brand system around it.",
    challenge:
      "Turn a promising niche platform into a credible, scalable marketplace without losing the community and Bitcoin roots that made it distinct.",
    built: [
      "Marketplace architecture and discovery",
      "Host onboarding and listing operations",
      "Booking, availability, payout, and payment flows",
      "Product redesign and AirBTC → HodlStay brand evolution",
      "Launch, analytics, SEO, and lifecycle foundations",
    ],
    stack: ["Next.js", "React", "Supabase", "BTCPay", "Resend", "Vercel"],
    image: "/work/hodlstay-home.png",
    width: 1270,
    height: 714,
    alt: "HodlStay global booking marketplace",
    status: "Live product",
  },
  {
    id: "satoshi-gazette",
    number: "02",
    name: "Satoshi Gazette",
    category: "Media · Data · AI-assisted operations",
    title: "A Bitcoin newsroom designed as an information product.",
    summary:
      "Satoshi Gazette combines a live market layer, structured editorial desks, long-form reporting, wire updates, and briefings. The product is being built to help operators separate useful signal from the daily noise.",
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
    image: "/work/satoshi-gazette-home.png",
    width: 1280,
    height: 720,
    alt: "Satoshi Gazette Bitcoin newsroom",
    status: "In development",
  },
] as const;

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
            <p>{item.summary}</p>
          </div>

          <div className="case-detail-screen">
            <div className="project-browser-chrome">
              <div><i /><i /><i /></div>
              <span>{item.name.toLowerCase().replace(" ", "")}</span>
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
        </article>
      ))}

      <section className="studio-inner-cta">
        <p className="studio-kicker">Your project could be next</p>
        <h2>Let’s build the proof.</h2>
        <Link href={getIntroCallUrl("work_bottom")} target="_blank" rel="noopener noreferrer" className="studio-button">
          Start a project <span aria-hidden>↗</span>
        </Link>
      </section>
    </div>
  );
}
