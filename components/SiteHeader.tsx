"use client";

import Link from "next/link";
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
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-logo">
          Emayda
        </Link>

        <nav className="site-nav-desktop">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                "site-nav-link" +
                (isActive(item.href) ? " site-nav-link--active" : "")
              }
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="https://calendly.com/" // TODO: real Calendly link
            className="site-nav-link site-nav-link--primary"
          >
            Book fit check
          </Link>
        </nav>

        <button
          type="button"
          className="site-nav-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          <span />
          <span />
        </button>
      </div>

      {open && (
        <nav className="site-nav-mobile">
          <div className="site-nav-mobile-inner">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="site-nav-mobile-link"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="https://calendly.com/"
              className="site-nav-mobile-link"
              onClick={() => setOpen(false)}
            >
              Book a 15min fit check
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
