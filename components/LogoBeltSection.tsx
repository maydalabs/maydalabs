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
  { name: "Next.js", src: "/logos/stack/next.png", alt: "Next.js" },
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
  const proofLogos = [
    brandLogos[0],
    brandLogos[1],
    brandLogos[2],
    brandLogos[3],
    stackLogos[0],
    stackLogos[2],
    stackLogos[3],
    stackLogos[5],
    stackLogos[8],
  ];

  return (
    <section
      aria-label="Selected brands and stack"
      className="relative z-10 w-screen"
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 py-2 md:px-6 md:py-3 lg:max-w-7xl lg:px-8">
        <div className="border-y border-border/70 py-4 md:py-5">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Selected work • operating stack
            </p>
            <p className="mt-2 text-sm text-slate-400 md:text-[0.95rem]">
              Selected work across commerce, SaaS, and service funnels, shipped
              on Shopify, Next.js, GA4, Vercel, and AWS.
            </p>
          </div>

          <div className="logos-marquee-wrapper relative mt-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
            <div
              className="pointer-events-none absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-background to-transparent"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-background to-transparent"
              aria-hidden="true"
            />

            <div
              className="logos-marquee-row flex items-center gap-8 md:gap-10"
              style={{ animationDuration: "46s" }}
            >
              {[...proofLogos, ...proofLogos].map((logo, idx) => (
                <div
                  key={`proof-${idx}-${logo.name}`}
                  className="flex items-center justify-center"
                >
                  <Image
                    src={logo.src}
                    alt={logo.alt ?? logo.name}
                    width={132}
                    height={40}
                    className="h-7 w-auto opacity-55 grayscale contrast-75 transition ease-out hover:opacity-80 hover:grayscale-0 md:h-8"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="logos-grid mt-4 grid grid-cols-3 gap-x-4 gap-y-3 sm:grid-cols-5">
            {proofLogos.map((logo) => (
              <div
                key={`grid-${logo.name}`}
                className="flex items-center justify-center"
              >
                <Image
                  src={logo.src}
                  alt={logo.alt ?? logo.name}
                  width={132}
                  height={40}
                  className="h-7 w-auto opacity-60 grayscale contrast-75 md:h-8"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
