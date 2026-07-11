"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getIntroCallUrl } from "@/lib/marketingLinks";
import { MaydaMark } from "@/components/MaydaMark";

const NAV_ITEMS = [
  { label: "Work", href: "/case-studies", section: "work" },
  { label: "Services", href: "/services", section: "services" },
  { label: "Approach", href: "/#approach", section: "approach" },
  { label: "About", href: "/about" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (pathname !== "/") {
      return;
    }

    let frame = 0;
    const updateActiveSection = () => {
      frame = 0;
      const marker = window.scrollY + window.innerHeight * 0.34;
      let current: string | null = null;

      for (const id of ["work", "services", "approach"]) {
        const section = document.getElementById(id);
        if (section && section.offsetTop <= marker) current = id;
      }

      setActiveSection(current);
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateActiveSection);
    };

    frame = window.requestAnimationFrame(updateActiveSection);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  const isActive = (item: (typeof NAV_ITEMS)[number]) => {
    if (item.label === "Work" && pathname === "/case-studies") return true;
    if (item.label === "Services" && pathname === "/services") return true;
    if (item.label === "About" && pathname === "/about") return true;
    return pathname === "/" && item.section === activeSection;
  };

  return (
    <header className={`studio-header ${scrolled || open ? "is-scrolled" : ""}`}>
      <div className="studio-shell flex h-[72px] items-center justify-between gap-5">
        <Link href="/" className="group flex items-center gap-3" aria-label="MaydaLabs home">
          <MaydaMark className="h-8 w-8 text-white" />
          <span className="text-[0.82rem] font-bold uppercase tracking-[0.18em] text-white">
            MaydaLabs
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`studio-nav-link ${isActive(item) ? "is-active" : ""}`}
              aria-current={
                (item.label === "Work" && pathname === "/case-studies") ||
                (item.label === "Services" && pathname === "/services") ||
                (item.label === "About" && pathname === "/about")
                  ? "page"
                  : undefined
              }
            >
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
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              className={isActive(item) ? "is-active" : ""}
            >
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
