"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/programs", label: "Programs" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 md:max-w-5xl md:px-6 md:py-4">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl border border-border bg-surface-alt/60 shadow-sm group-hover:border-mayda-teal group-hover:shadow-[0_0_0_1px_rgba(96,164,186,0.4)]">
            {/* If you created /mayda-labs-mark.svg, this will show it. */}
            <Image
              src="/mayda-labs-mark.svg"
              alt="Mayda Labs mark"
              width={18}
              height={18}
              className="opacity-90"
            />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-foreground">
              Mayda Labs
            </span>
            <span className="text-[0.7rem] uppercase tracking-[0.18em] text-muted">
              Growth partner
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm transition-colors ${
                isActive(item.href)
                  ? "text-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="https://calendly.com/" // TODO: real Calendly link
            className="inline-flex items-center justify-center rounded-full border border-mayda-teal bg-mayda-teal/15 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-mayda-teal/25"
          >
            Book fit check
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-alt md:hidden"
          aria-label="Toggle navigation"
        >
          <span className="sr-only">Toggle navigation</span>
          <span
            className={`block h-[2px] w-4 rounded-full bg-foreground transition-transform ${
              open ? "translate-y-[3px] rotate-45" : ""
            }`}
          />
          <span
            className={`block h-[2px] w-4 rounded-full bg-foreground transition-transform ${
              open ? "-translate-y-[3px] -rotate-45" : "mt-[3px]"
            }`}
          />
        </button>
      </div>

      {/* Mobile nav */}
      {open && (
        <nav className="border-t border-border bg-background/98 px-4 pb-4 pt-2 md:hidden">
          <div className="mx-auto flex max-w-5xl flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`rounded-md px-1 py-1.5 text-sm ${
                  isActive(item.href)
                    ? "bg-surface-alt text-foreground"
                    : "text-muted hover:bg-surface-alt/60 hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="https://calendly.com/"
              onClick={() => setOpen(false)}
              className="mt-1 inline-flex items-center justify-center rounded-full border border-mayda-teal bg-mayda-teal/15 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-mayda-teal/25"
            >
              Book a 15min fit check
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
