// components/LogoBeltSection.tsx

const logoNames = [
  "AirBTC",
  "AryaMiner",
  "Satoshi Gazette",
  "Mortal Vault",
  "Bitcredit",
  "Analytics Stack",
  "Lifecycle Stack",
  "Shopify & BTCPay",
];

const logoRow1 = logoNames.filter((_, i) => i % 2 === 0);
const logoRow2 = logoNames.filter((_, i) => i % 2 === 1);

export function LogoBeltSection() {
  return (
    <section
      aria-label="Selected brands and stack"
      className="relative z-10 w-screen border-y border-border/70 bg-surface/80 backdrop-blur-sm shadow-[0_22px_80px_rgba(2,6,23,0.85)]"
      // break out of the centered max-w layout and go true full-bleed
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      }}
    >
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-10">
        <p className="text-center text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted">
          Selected brands • Our stack
        </p>
        <p className="mt-1 text-center text-xs text-muted sm:text-[0.9rem]">
          Work across eCommerce, SaaS, and services, plus the analytics and
          lifecycle stack behind it. Logos are illustrative—no endorsement
          implied.
        </p>

        {/* Marquee version */}
        <div className="logos-marquee-wrapper relative mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          {/* soft fades on edges */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-surface to-transparent"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-surface to-transparent"
            aria-hidden="true"
          />

          <div className="space-y-3">
            {/* Row 1 */}
            <div className="logos-marquee-row logos-marquee-row-1 flex gap-6">
              {[...logoRow1, ...logoRow1].map((name, idx) => (
                <div
                  key={`r1-${idx}-${name}`}
                  className="flex h-10 items-center justify-center rounded-xl border border-border/70 bg-surface-alt/70 px-4 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted/80 grayscale opacity-70 transition-transform transition-colors hover:-translate-y-0.5 hover:text-foreground hover:grayscale-0 hover:opacity-100"
                >
                  {name}
                </div>
              ))}
            </div>

            {/* Row 2 */}
            <div className="logos-marquee-row logos-marquee-row-2 flex gap-6">
              {[...logoRow2, ...logoRow2].map((name, idx) => (
                <div
                  key={`r2-${idx}-${name}`}
                  className="flex h-10 items-center justify-center rounded-xl border border-border/70 bg-surface-alt/70 px-4 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted/80 grayscale opacity-70 transition-transform transition-colors hover:-translate-y-0.5 hover:text-foreground hover:grayscale-0 hover:opacity-100"
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reduced-motion / hard fallback grid */}
        <div className="logos-grid mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {logoNames.map((name) => (
            <div
              key={`grid-${name}`}
              className="flex h-10 items-center justify-center rounded-xl border border-border/70 bg-surface-alt/70 px-3 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted/80"
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
