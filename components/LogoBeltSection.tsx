// components/LogoBeltSection.tsx
import Image from "next/image";

type LogoItem = {
  name: string;
  src: string;
  alt?: string;
};

// Rail 1 – brands / roles / projects
const brandLogos: LogoItem[] = [
  { name: "AirBTC", src: "/logos/brands/airbtc.png", alt: "AirBTC" },
  {
    name: "Coin Mining Central",
    src: "/logos/brands/coin-mining-central.png",
    alt: "Coin Mining Central",
  },
  {
    name: "Independent Check",
    src: "/logos/brands/independent-check.png",
    alt: "Independent Check",
  },
  { name: "Bitcredit", src: "/logos/brands/bitcredit.png", alt: "Bitcredit" },
  { name: "Bitmain", src: "/logos/brands/bitmain.png", alt: "Bitmain" },
  { name: "WhatsMiner", src: "/logos/brands/whatsminer.png", alt: "WhatsMiner" },
  // When you export Satoshi Gazette icon, drop it in /public/logos/brands and add:
  // {
  //   name: "Satoshi Gazette",
  //   src: "/logos/brands/satoshi-gazette.png",
  //   alt: "Satoshi Gazette",
  // },
];

// Rail 2 – stack / tooling (PostgreSQL removed)
const stackLogos: LogoItem[] = [
  { name: "Shopify", src: "/logos/stack/shopify.png", alt: "Shopify" },
  { name: "WooCommerce", src: "/logos/stack/woocommerce.png", alt: "WooCommerce" },
  { name: "Next.js", src: "/logos/stack/nextjs.png", alt: "Next.js" },
  { name: "Vercel", src: "/logos/stack/vercel.png", alt: "Vercel" },
  { name: "Supabase", src: "/logos/stack/supabase.png", alt: "Supabase" },
  { name: "AWS", src: "/logos/stack/aws.png", alt: "AWS" },
  { name: "Lightning", src: "/logos/stack/lightning.png", alt: "Lightning Network" },
  { name: "Cloudflare", src: "/logos/stack/cloudflare.png", alt: "Cloudflare" },
  { name: "GA4 + GTM", src: "/logos/stack/ga4.png", alt: "GA4 and GTM" },
  // Add BTCPay when you have the asset:
  // { name: "BTCPay Server", src: "/logos/stack/btcpay-server.png", alt: "BTCPay Server" },
];

export function LogoBeltSection() {
  const allLogos = [...brandLogos, ...stackLogos];

  return (
    <section
      aria-label="Selected brands and stack"
      className="relative z-10 w-screen"
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 py-4 md:px-6 md:py-6 lg:max-w-7xl">
        {/* Kicker-style label – matches hero kicker tone */}
        <p className="text-center text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
          SELECTED BRANDS • STACK
        </p>

        {/* Marquee rails – pure logos, more gap, slower scroll */}
        <div className="logos-marquee-wrapper relative mt-5 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          {/* Edge fades only */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-background to-transparent"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent"
            aria-hidden="true"
          />

          <div className="space-y-4">
            {/* Row 1 – brands (bigger) */}
            <div
              className="logos-marquee-row logos-marquee-row-1 flex items-center gap-10 md:gap-12"
              style={{ animationDuration: "42s" }}
            >
              {[...brandLogos, ...brandLogos].map((logo, idx) => (
                <div
                  key={`brand-${idx}-${logo.name}`}
                  className="flex items-center justify-center"
                >
                  <Image
                    src={logo.src}
                    alt={logo.alt ?? logo.name}
                    width={170}
                    height={56}
                    className="h-12 w-auto md:h-14 opacity-80 grayscale transition ease-out hover:opacity-100 hover:grayscale-0"
                  />
                </div>
              ))}
            </div>

            {/* Row 2 – stack (slightly smaller, also slower) */}
            <div
              className="logos-marquee-row logos-marquee-row-2 flex items-center gap-8 md:gap-10"
              style={{ animationDuration: "50s" }}
            >
              {[...stackLogos, ...stackLogos].map((logo, idx) => (
                <div
                  key={`stack-${idx}-${logo.name}`}
                  className="flex items-center justify-center"
                >
                  <Image
                    src={logo.src}
                    alt={logo.alt ?? logo.name}
                    width={140}
                    height={48}
                    className="h-9 w-auto md:h-10 opacity-80 grayscale transition ease-out hover:opacity-100 hover:grayscale-0"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reduced-motion / fallback grid – tight and clean */}
        <div className="logos-grid mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {allLogos.map((logo) => (
            <div
              key={`grid-${logo.name}`}
              className="flex items-center justify-center"
            >
              <Image
                src={logo.src}
                alt={logo.alt ?? logo.name}
                width={150}
                height={50}
                className="h-10 w-auto opacity-80 grayscale"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
