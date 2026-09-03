import "@/app/brand.css";
import type { Metadata } from "next";
import { BitcoinClock } from "@/components/BitcoinClock";
import { Logo, LogoMark, LogoMarkBitcoin } from "@/components/Logo";
import { LogoCandidateGallery } from "@/components/LogoCandidates";
import { Reveal } from "@/components/Reveal";
import { SignalField } from "@/components/SignalField";
import { ApprovalQueue } from "@/components/illustrations/ApprovalQueue";
import { PaymentsFlow } from "@/components/illustrations/PaymentsFlow";

export const metadata: Metadata = {
  title: "Brand preview",
  robots: { index: false, follow: false },
};

const MARK_SIZES = [16, 24, 32, 40, 64];

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mayda-mono text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--mist)]">
      {children}
    </p>
  );
}

export default function BrandPreviewPage() {
  return (
    <div className="mayda-shell-wide pb-24 pt-10">
      <p className="mayda-kicker">Brand preview</p>
      <h1 className="mayda-heading mt-3">Mark, clock, field, figures.</h1>
      <p className="mayda-lead mt-4 max-w-2xl">
        Internal page. Every new brand component on the void, then the mono variants on frost.
      </p>

      {/* 0. Mark candidates — pick one by its id */}
      <section id="candidates" className="mt-12 border-t border-[color:var(--border)] pt-10">
        <p className="mayda-kicker">Mark candidates · pick by number</p>
        <p className="mayda-body" style={{ maxWidth: "44rem", marginTop: "0.5rem" }}>
          Each row: the mark large in the brand gradient, the header lockup at real size, a 16 px favicon on a
          browser tab, a 40 px app tile, and the mono version on frost. Same stroke weight throughout.
        </p>
        <LogoCandidateGallery />
      </section>

      {/* 1. Logo family */}
      <section className="mt-16 grid gap-10 border-t border-[color:var(--border)] pt-10 md:grid-cols-2">
        <div className="mayda-stack">
          <Label>LogoMark · 16 / 24 / 32 / 40 / 64</Label>
          <div className="flex flex-wrap items-end gap-6">
            {MARK_SIZES.map((size) => (
              <LogoMark key={size} size={size} />
            ))}
          </div>
          <Label>Favicon simulation (app/icon.svg geometry)</Label>
          <div className="flex items-center gap-4">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-[3.5px] bg-[color:var(--void)] ring-1 ring-[color:var(--border-strong)]">
              <LogoMark size={16} />
            </span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-[7px] bg-[color:var(--void)] ring-1 ring-[color:var(--border-strong)]">
              <LogoMark size={32} />
            </span>
          </div>
        </div>
        <div className="mayda-stack">
          <Label>Logo lockup · header size, and as a link (hover glow)</Label>
          <Logo />
          <a href="#top" className="inline-flex">
            <Logo />
          </a>
          <Label>LogoMarkBitcoin · 28 / 40 (payments badge)</Label>
          <div className="flex items-end gap-6">
            <LogoMarkBitcoin size={28} />
            <LogoMarkBitcoin size={40} />
            <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] px-3 py-1.5 text-sm">
              <LogoMarkBitcoin size={18} /> Bitcoin payments engineering
            </span>
          </div>
        </div>
      </section>

      {/* 2. Block clock */}
      <section className="mt-16 border-t border-[color:var(--border)] pt-10">
        <Label>BitcoinClock · inline (en) · badge (tr, fr)</Label>
        <div className="mt-5 flex flex-wrap items-center gap-8 rounded-[var(--radius-md)] border border-[color:var(--border)] px-5 py-4">
          <Logo />
          <BitcoinClock locale="en" variant="inline" />
          <BitcoinClock locale="tr" variant="badge" />
          <BitcoinClock locale="fr" variant="badge" />
        </div>
      </section>

      {/* 3. Hero with SignalField */}
      <section className="mt-16 border-t border-[color:var(--border)] pt-10">
        <Label>SignalField · hero background</Label>
        <div className="relative mt-5 overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--void)]">
          <SignalField />
          <div className="relative z-10 px-8 py-20 md:px-14 md:py-28">
            <p className="mayda-kicker">Bitcoin-first operations company</p>
            <h2 className="mayda-display mt-5 max-w-3xl">
              AI runs the operation.
              <br />
              You approve every action.
            </h2>
            <p className="mayda-lead mt-6 max-w-xl">
              We install AI-run operations for Bitcoin companies. Every claim is source-linked.
              Nothing goes out without a human approval.
            </p>
            <div className="mayda-hero-actions mt-8">
              <span className="mayda-button">Start a pilot</span>
              <span className="mayda-button mayda-button-outline">See the system live</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Reveal + card lift */}
      <section className="mt-16 border-t border-[color:var(--border)] pt-10">
        <Label>Reveal · delays 0 / 120 / 240ms · cards with mayda-card-lift</Label>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {["Scope", "Install", "Operate"].map((title, index) => (
            <Reveal
              key={title}
              as="article"
              delay={index * 120}
              className="mayda-card mayda-card-lift"
            >
              <p className="mayda-card-number">0{index + 1}</p>
              <h3 className="mayda-subheading mt-3">{title}</h3>
              <p className="mayda-body mt-2 text-[color:var(--mist)]">
                One workflow, named precisely: what comes in, what goes out, who approves.
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 5. Illustrations */}
      <section className="mt-16 grid gap-10 border-t border-[color:var(--border)] pt-10 lg:grid-cols-2">
        <div className="mayda-stack">
          <Label>ApprovalQueue · focus walks every 6s</Label>
          <ApprovalQueue />
        </div>
        <div className="mayda-stack">
          <Label>PaymentsFlow · pulse rides the rail</Label>
          <PaymentsFlow />
        </div>
      </section>

      {/* 6. Light section: mono variants */}
      <section className="mt-16 rounded-[var(--radius-lg)] bg-[color:var(--frost)] px-8 py-10 text-[color:var(--void)]">
        <p className="mayda-mono text-[0.7rem] uppercase tracking-[0.16em] text-[#4a5262]">
          Mono variants on frost
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-10">
          <Logo mono />
          <div className="flex items-end gap-5">
            {MARK_SIZES.map((size) => (
              <LogoMark key={size} size={size} mono />
            ))}
          </div>
          <LogoMarkBitcoin size={40} mono />
          <span className="text-[color:var(--cobalt)]">
            <LogoMark size={40} mono />
          </span>
        </div>
      </section>
    </div>
  );
}
