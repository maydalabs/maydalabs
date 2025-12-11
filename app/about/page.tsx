import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About – Mayda Labs growth partner",
  description:
    "Mayda Labs is a focused growth partner for digital brands, combining CRO, analytics, and lifecycle systems with a bias for shipping and clear communication.",
};

export default function AboutPage() {
  return (
    <div className="space-y-10 md:space-y-12">
      {/* Intro */}
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          About Mayda Labs
        </h1>
        <p className="max-w-2xl text-sm text-muted sm:text-[0.95rem]">
          Mayda Labs is a focused growth partner for digital brands. The work
          sits where analytics, UX, and lifecycle meet – with a simple goal:
          turn underperforming traffic into meetings, clients, and revenue.
        </p>
        <p className="max-w-2xl text-xs text-muted sm:text-sm">
          The DNA comes from Emayda – less “agency noise”, more clean systems
          and measurable lifts. The name changes, the philosophy doesn&apos;t.
        </p>
      </section>

      {/* Where it fits */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground sm:text-xl">
          Where Mayda Labs fits
        </h2>
        <p className="max-w-2xl text-xs text-muted sm:text-sm">
          Mayda Labs is for teams who already have some traction but know their
          numbers and flows aren&apos;t where they should be:
        </p>
        <ul className="ml-4 max-w-3xl list-disc space-y-1 text-sm text-muted">
          <li>Traffic is “okay”, but revenue per visitor is underwhelming.</li>
          <li>
            Tracking is half-broken – GA4, pixels, and events don&apos;t fully
            agree.
          </li>
          <li>
            Funnels and lifecycle were built incrementally and now feel bolted
            together.
          </li>
        </ul>
      </section>

      {/* How we work */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground sm:text-xl">
          How we work
        </h2>
        <ul className="ml-4 max-w-3xl list-disc space-y-2 text-sm text-muted">
          <li>
            <strong className="font-semibold text-foreground">
              Baseline first.
            </strong>{" "}
            Clean up data and understand the real funnel before throwing tests
            at it.
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Ship fast.
            </strong>{" "}
            Short sprints, visible changes, documented decisions. No 6-month
            “strategy decks”.
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Compound.
            </strong>{" "}
            Keep what works, kill what doesn&apos;t, and build a simple rhythm
            around experiments and lifecycle.
          </li>
        </ul>
      </section>

      {/* Who's behind it */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground sm:text-xl">
          Who&apos;s behind it
        </h2>
        <p className="max-w-3xl text-sm text-muted">
          Mayda Labs is run by a practitioner, not a committee. The person you
          talk to is the person who touches your funnels, analytics, and flows.
          No layers of account managers, no mystery team.
        </p>
        <p className="max-w-3xl text-sm text-muted">
          Background spans ecommerce, SaaS, and Bitcoin-native projects – with a
          bias toward self-serve products and businesses that live or die by
          their website performance.
        </p>
      </section>
    </div>
  );
}
