import type { Locale } from "@/lib/i18n";

/*
 * The stack strip: what MaydaLabs builds with, the Bitcoin rails and data
 * it runs on, and who it has worked with. Audited from the three repos on
 * 3 Sep 2026 (maydalabs, satoshi-gazette, abidin) plus the HodlStay case.
 * Icons: `si:` keys resolve to simple-icons (CC0 glyphs; brand rules
 * still apply), `img:` to a file in /public, `text:` to a plain chip for
 * marks we do not have the right to redraw. Add employers/clients only
 * with their asset and Mehmet's OK.
 */

export type StackItem = {
  name: string;
  href: string;
  icon: `si:${string}` | `img:${string}` | `text:${string}`;
};

export type StackGroup = {
  id: "built" | "rails" | "worked";
  label: Record<Locale, string>;
  items: StackItem[];
};

export const STACK_GROUPS: StackGroup[] = [
  {
    id: "built",
    label: { en: "Built with", tr: "Üzerine kurulu", fr: "Construit avec" },
    items: [
      { name: "Next.js", href: "https://nextjs.org", icon: "si:Nextdotjs" },
      { name: "React", href: "https://react.dev", icon: "si:React" },
      { name: "TypeScript", href: "https://www.typescriptlang.org", icon: "si:Typescript" },
      { name: "Tailwind CSS", href: "https://tailwindcss.com", icon: "si:Tailwindcss" },
      { name: "Supabase", href: "https://supabase.com", icon: "si:Supabase" },
      { name: "PostgreSQL", href: "https://www.postgresql.org", icon: "si:Postgresql" },
      { name: "Vercel", href: "https://vercel.com", icon: "si:Vercel" },
      { name: "Resend", href: "https://resend.com", icon: "si:Resend" },
      { name: "Python", href: "https://www.python.org", icon: "si:Python" },
      { name: "Claude", href: "https://www.anthropic.com", icon: "si:Claude" },
      { name: "GitHub", href: "https://github.com/maydalabs", icon: "si:Github" },
    ],
  },
  {
    id: "rails",
    label: { en: "Bitcoin rails and data", tr: "Bitcoin rayları ve verisi", fr: "Rails et données Bitcoin" },
    items: [
      { name: "Bitcoin", href: "https://bitcoin.org", icon: "si:Bitcoin" },
      { name: "Lightning", href: "https://lightning.network", icon: "si:Lightning" },
      { name: "BTCPay Server", href: "https://btcpayserver.org", icon: "text:BTCPay Server" },
      { name: "mempool.space", href: "https://mempool.space", icon: "text:mempool.space" },
    ],
  },
  {
    id: "worked",
    label: { en: "Worked with", tr: "Birlikte çalıştık", fr: "Nous avons travaillé avec" },
    items: [
      { name: "Satoshi Gazette", href: "https://satoshigazette.org", icon: "img:/work/satoshi-gazette-ec1-mark.svg" },
      { name: "HodlStay", href: "https://hodlstay.com", icon: "img:/work/hodlstay-logo.png" },
    ],
  },
];
