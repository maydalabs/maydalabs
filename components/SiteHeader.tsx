"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getIntroCallUrl } from "@/lib/marketingLinks";

const NAV_ITEMS = [
  { label: "Work", href: "/#work" },
  { label: "Services", href: "/#services" },
  { label: "Approach", href: "/#approach" },
  { label: "About", href: "/about" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`studio-header ${scrolled || open ? "is-scrolled" : ""}`}>
      <div className="studio-shell flex h-[72px] items-center justify-between gap-5">
        <Link href="/" className="group flex items-center gap-3" aria-label="MaydaLabs home">
          <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-white/15 bg-white/[0.04]">
            <Image
              src="/mayda-labs-mark.svg"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 transition-transform duration-500 group-hover:rotate-12"
            />
          </span>
          <span className="text-[0.82rem] font-bold uppercase tracking-[0.18em] text-white">
            MaydaLabs
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => (
            <Link key={item.label} href={item.href} className="studio-nav-link">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link
            href={getIntroCallUrl("header")}
            target="_blank"
            rel="noopener noreferrer"
            className="studio-button studio-button-small"
          >
            Start a project <span aria-hidden>↗</span>
          </Link>
        </div>

        <button
          type="button"
          className="studio-menu-button md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span className={open ? "translate-y-[4px] rotate-45" : ""} />
          <span className={open ? "-translate-y-[3px] -rotate-45" : ""} />
        </button>
      </div>

      {open ? (
        <nav className="studio-mobile-nav md:hidden" aria-label="Mobile navigation">
          {NAV_ITEMS.map((item, index) => (
            <Link key={item.label} href={item.href} onClick={() => setOpen(false)}>
              <span>0{index + 1}</span>
              {item.label}
            </Link>
          ))}
          <Link
            href={getIntroCallUrl("mobile_header")}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="studio-button mt-3"
          >
            Start a project <span aria-hidden>↗</span>
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
