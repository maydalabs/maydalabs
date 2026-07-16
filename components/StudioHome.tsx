import Link from "next/link";
import { BuildDossier } from "@/components/BuildDossier";
import { HomeExperience } from "@/components/HomeExperience";
import { ProjectPreview } from "@/components/ProjectPreview";
import { ServiceRouter } from "@/components/ServiceRouter";
import { SignalField } from "@/components/SignalField";
import { getIntroCallUrl } from "@/lib/marketingLinks";

const PROCESS = [
  { number: "01", title: "Find the signal", copy: "We turn the messy brief into a crisp product and commercial target." },
  { number: "02", title: "Shape the system", copy: "Flows, architecture, visual language, and priorities become one build plan." },
  { number: "03", title: "Ship in public", copy: "Working software arrives in tight cycles, with decisions made against the real thing." },
  { number: "04", title: "Create momentum", copy: "We instrument, launch, learn, and build the next highest-leverage move." },
];

function ArrowUpRight() {
  return <span aria-hidden className="text-[0.9em]">↗</span>;
}

export function StudioHome() {
  const projectUrl = getIntroCallUrl("home_hero");

  return (
    <HomeExperience>
      <section className="studio-hero">
        <div className="studio-hero-copy">
          <div className="studio-eyebrow hero-reveal hero-reveal-1">
            <span className="studio-status-dot" />
            Product & growth studio · Istanbul / Everywhere
          </div>

          <h1 className="hero-reveal hero-reveal-2">
            We build software
            <br />
            people can <em>feel.</em>
          </h1>

          <p className="hero-reveal hero-reveal-3">
            Apps, marketplaces, commerce, and the growth systems around them.
            Built for founders with ambitious ideas and no patience for agency theatre.
          </p>

          <div className="hero-reveal hero-reveal-4 flex flex-col gap-3 sm:flex-row">
            <Link href={projectUrl} target="_blank" rel="noopener noreferrer" className="studio-button">
              Start a project <ArrowUpRight />
            </Link>
            <Link href="/#work" className="studio-button studio-button-ghost">
              Explore our work <span aria-hidden>↓</span>
            </Link>
          </div>
        </div>

        <div className="hero-reveal hero-reveal-3 studio-hero-visual">
          <SignalField />
        </div>

        <div className="studio-hero-index" aria-hidden="true">
          <span>ML / 2026</span>
          <span>DESIGN · CODE · GROWTH</span>
        </div>
      </section>

      <section className="studio-manifesto" aria-label="Positioning" data-reveal>
        <p>Bitcoin-native by proof.</p>
        <p>Founder-focused by design.</p>
        <div className="studio-manifesto-line" />
        <span>We work across industries.</span>
      </section>

      <section id="work" className="studio-section scroll-mt-28">
        <div className="studio-section-heading" data-reveal>
          <div>
            <p className="studio-kicker">Selected work / 001–002</p>
            <h2>Proof, not promises.</h2>
          </div>
          <p>
            Our first flagships live in Bitcoin. They prove the range: a global marketplace on one side, a living media system on the other.
          </p>
        </div>

        <article className="project-case project-case-hodl">
          <div className="project-case-copy">
            <div className="project-case-topline">
              <span>01 / HodlStay</span>
              <span>Marketplace · Travel · Bitcoin</span>
            </div>
            <div>
              <p className="project-case-label">A stay worth holding onto</p>
              <h3>Turning a Bitcoin travel idea into a global booking product.</h3>
              <p className="project-case-description">
                Product strategy, marketplace architecture, host and guest journeys, booking operations, payments, brand evolution, and launch systems in one connected build.
              </p>
            </div>
            <div className="project-case-tags">
              <span>Product</span><span>UX/UI</span><span>Next.js</span><span>Supabase</span><span>Bitcoin payments</span>
            </div>
            <div className="project-case-links">
              <Link href="/case-studies/hodlstay" className="studio-text-link">
                View project story <ArrowUpRight />
              </Link>
              <a href="https://hodlstay.com" target="_blank" rel="noopener noreferrer" className="studio-text-link studio-text-link-muted">
                Visit live <ArrowUpRight />
              </a>
            </div>
          </div>

          <ProjectPreview
            variant="hodl"
            domain="hodlstay.com"
            status="Client project · Live"
            imageSrc="/work/hodlstay-home.png"
            imageAlt="HodlStay marketplace homepage"
            imageWidth={1270}
            imageHeight={714}
            watermarkSrc="/work/hodlstay-logo.png"
            watermarkWidth={6865}
            watermarkHeight={1255}
            watermarkClassName="project-watermark-wide"
          />
        </article>

        <article className="project-case project-case-gazette">
          <div className="project-case-copy">
            <div className="project-case-topline">
              <span>02 / Satoshi Gazette</span>
              <span>Media · Data · AI-assisted ops</span>
            </div>
            <div>
              <p className="project-case-label">Signal for Bitcoin operators</p>
              <h3>Building a newsroom as a product, not just a publication.</h3>
              <p className="project-case-description">
                An editorial system that connects live market context, structured desks, publishing workflows, briefings, and AI-assisted operations without losing human judgment.
              </p>
            </div>
            <div className="project-case-tags">
              <span>Editorial UX</span><span>Data systems</span><span>Automation</span><span>CMS</span><span>AI workflows</span>
            </div>
            <div className="project-case-links">
              <Link href="/case-studies#satoshi-gazette" className="studio-text-link">
                View project story <ArrowUpRight />
              </Link>
              <a href="https://satoshigazette.org" target="_blank" rel="noopener noreferrer" className="studio-text-link studio-text-link-muted">
                Visit live <ArrowUpRight />
              </a>
            </div>
          </div>

          <ProjectPreview
            variant="gazette"
            domain="satoshigazette.org"
            status="Live · Active build"
            imageSrc="/work/satoshi-gazette-home.png"
            imageAlt="Satoshi Gazette Bitcoin newsroom homepage"
            imageWidth={1280}
            imageHeight={720}
            watermarkSrc="/work/satoshi-gazette-mark.png"
            watermarkWidth={1080}
            watermarkHeight={1080}
            watermarkClassName="project-watermark-mark"
          />
        </article>
      </section>

      <section id="services" className="studio-section studio-services scroll-mt-28">
        <div className="studio-section-heading" data-reveal>
          <div>
            <p className="studio-kicker">What we build / Three connected layers</p>
            <h2>From first click to working business.</h2>
          </div>
          <p>
            You do not need five disconnected vendors. We connect the product, the experience, and the system that brings people back.
          </p>
        </div>

        <ServiceRouter />
      </section>

      <BuildDossier />

      <section id="approach" className="studio-section scroll-mt-28">
        <div className="studio-section-heading" data-reveal>
          <div>
            <p className="studio-kicker">How we work / No black box</p>
            <h2>Momentum is the method.</h2>
          </div>
          <p>
            Every engagement is scoped after a conversation. The shape changes; the operating rhythm does not.
          </p>
        </div>
        <div className="studio-process-grid">
          {PROCESS.map((step) => (
            <article key={step.number} data-reveal>
              <span>{step.number}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="studio-final-cta" data-reveal>
        <div className="studio-availability"><span /> Open for new client work</div>
        <p className="studio-kicker">Have something ambitious in mind?</p>
        <h2>Bring the messy idea.<br /><em>We’ll find the signal.</em></h2>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={getIntroCallUrl("home_bottom")} target="_blank" rel="noopener noreferrer" className="studio-button studio-button-light">
            Book a project call <ArrowUpRight />
          </Link>
          <a href="mailto:info@maydalabs.com" className="studio-button studio-button-outline-light">
            Email the brief
          </a>
        </div>
        <p className="studio-final-note">No fixed packages. We scope the right engagement after we understand the job.</p>
      </section>
    </HomeExperience>
  );
}
