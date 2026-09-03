import type { Locale } from "@/lib/i18n";

/*
 * Stack, rails, and partners. Everything here was derived from the repos on
 * 3 Sep 2026 — maydalabs, satoshi-gazette, abidin, The Bitcoin Way
 * (concept), mortal-vault, sofra — plus the HodlStay case. Icons: `si:` keys
 * resolve to simple-icons (CC0 glyphs; brand rules still apply), `img:` to a
 * file under /public/logos. The strip shows logos only; names live in the
 * tooltip and for screen readers.
 */

export type StackItem = {
  id: string;
  name: string;
  href: string;
  icon: `si:${string}` | `img:${string}`;
  /** Wordmark-shaped logos keep their aspect ratio instead of a square. */
  wide?: boolean;
};

const CATALOG = {
  nextjs: { name: "Next.js", href: "https://nextjs.org", icon: "si:Nextdotjs" },
  react: { name: "React", href: "https://react.dev", icon: "si:React" },
  typescript: { name: "TypeScript", href: "https://www.typescriptlang.org", icon: "si:Typescript" },
  tailwind: { name: "Tailwind CSS", href: "https://tailwindcss.com", icon: "si:Tailwindcss" },
  supabase: { name: "Supabase", href: "https://supabase.com", icon: "si:Supabase" },
  neon: { name: "Neon", href: "https://neon.tech", icon: "si:Neon" },
  postgresql: { name: "PostgreSQL", href: "https://www.postgresql.org", icon: "si:Postgresql" },
  vercel: { name: "Vercel", href: "https://vercel.com", icon: "si:Vercel" },
  resend: { name: "Resend", href: "https://resend.com", icon: "si:Resend" },
  python: { name: "Python", href: "https://www.python.org", icon: "si:Python" },
  claude: { name: "Claude", href: "https://www.anthropic.com", icon: "si:Claude" },
  github: { name: "GitHub", href: "https://github.com/maydalabs", icon: "si:Github" },
  githubactions: { name: "GitHub Actions", href: "https://github.com/features/actions", icon: "si:Githubactions" },
  docker: { name: "Docker", href: "https://www.docker.com", icon: "si:Docker" },
  kubernetes: { name: "Kubernetes", href: "https://kubernetes.io", icon: "si:Kubernetes" },
  nginx: { name: "nginx", href: "https://nginx.org", icon: "si:Nginx" },
  threejs: { name: "Three.js", href: "https://threejs.org", icon: "si:Threedotjs" },
  gsap: { name: "GSAP", href: "https://gsap.com", icon: "si:Gsap" },
  solidity: { name: "Solidity", href: "https://soliditylang.org", icon: "si:Solidity" },
  ethereum: { name: "Ethereum", href: "https://ethereum.org", icon: "si:Ethereum" },
  openzeppelin: { name: "OpenZeppelin", href: "https://www.openzeppelin.com", icon: "si:Openzeppelin" },
  shadcn: { name: "shadcn/ui", href: "https://ui.shadcn.com", icon: "si:Shadcnui" },
  radix: { name: "Radix UI", href: "https://www.radix-ui.com", icon: "si:Radixui" },
  betterauth: { name: "Better Auth", href: "https://www.better-auth.com", icon: "si:Betterauth" },
  zod: { name: "Zod", href: "https://zod.dev", icon: "si:Zod" },
  sentry: { name: "Sentry", href: "https://sentry.io", icon: "si:Sentry" },
  posthog: { name: "PostHog", href: "https://posthog.com", icon: "si:Posthog" },
  googlemaps: { name: "Google Maps Platform", href: "https://developers.google.com/maps", icon: "si:Googlemaps" },
  vitest: { name: "Vitest", href: "https://vitest.dev", icon: "si:Vitest" },
  bitcoin: { name: "Bitcoin", href: "https://bitcoin.org", icon: "si:Bitcoin" },
  lightning: { name: "Lightning Network", href: "https://lightning.network", icon: "si:Lightning" },
  btcpay: { name: "BTCPay Server", href: "https://btcpayserver.org", icon: "img:/logos/btcpay.svg" },
  mempool: { name: "mempool.space", href: "https://mempool.space", icon: "img:/logos/mempool-space.png", wide: true },
  cmc: { name: "Coin Mining Central", href: "https://www.coinminingcentral.com", icon: "img:/logos/coin-mining-central.png" },
  hodlstay: { name: "HodlStay", href: "https://hodlstay.com", icon: "img:/work/hodlstay-logo.png", wide: true },
  dtravel: { name: "Dtravel", href: "https://www.dtravel.com", icon: "img:/logos/dtravel.svg" },
  hotelplanner: { name: "HotelPlanner", href: "https://www.hotelplanner.com", icon: "img:/logos/hotelplanner.png", wide: true },
} as const satisfies Record<string, Omit<StackItem, "id">>;

export type StackId = keyof typeof CATALOG;

export function stackItems(ids: readonly StackId[]): StackItem[] {
  return ids.map((id) => ({ id, ...CATALOG[id] }));
}

export type StackGroup = {
  id: "built" | "rails" | "worked";
  label: Record<Locale, string>;
  items: StackItem[];
};

export const STACK_GROUPS: StackGroup[] = [
  {
    id: "built",
    label: { en: "Built with", tr: "Üzerine kurulu", fr: "Construit avec" },
    items: stackItems([
      "nextjs", "react", "typescript", "tailwind", "supabase", "neon", "postgresql", "vercel", "resend",
      "python", "claude", "github", "docker", "kubernetes", "nginx", "threejs", "solidity", "shadcn",
      "sentry", "posthog", "vitest",
    ]),
  },
  {
    id: "rails",
    label: { en: "Bitcoin rails and data", tr: "Bitcoin rayları ve verisi", fr: "Rails et données Bitcoin" },
    items: stackItems(["bitcoin", "lightning", "btcpay", "mempool"]),
  },
  {
    id: "worked",
    label: { en: "Worked with", tr: "Birlikte çalıştık", fr: "Nous avons travaillé avec" },
    items: stackItems(["cmc", "hodlstay", "dtravel", "hotelplanner"]),
  },
];

/* Per-project stacks for the case studies (derived from each repo). */
export const PROJECT_STACKS: Record<"satoshi-gazette" | "hodlstay" | "mortal-vault" | "sofra" | "the-bitcoin-way" | "abidin", StackItem[]> = {
  "satoshi-gazette": stackItems(["nextjs", "react", "typescript", "tailwind", "supabase", "postgresql", "vercel", "resend", "python", "claude", "github", "bitcoin", "mempool"]),
  hodlstay: stackItems(["nextjs", "react", "typescript", "tailwind", "postgresql", "vercel", "bitcoin", "lightning", "btcpay"]),
  "mortal-vault": stackItems(["nextjs", "react", "typescript", "tailwind", "threejs", "solidity", "ethereum", "openzeppelin", "vitest", "githubactions"]),
  sofra: stackItems(["nextjs", "react", "typescript", "tailwind", "neon", "postgresql", "shadcn", "radix", "betterauth", "zod", "sentry", "posthog", "googlemaps", "resend", "vitest", "githubactions"]),
  "the-bitcoin-way": stackItems(["nextjs", "react", "typescript", "tailwind", "gsap", "threejs", "claude", "docker", "nginx", "vitest"]),
  abidin: stackItems(["python", "claude", "docker", "kubernetes", "github"]),
};
