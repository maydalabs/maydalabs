"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const FIT_CHECK_URL =
  "https://calendly.com/emayda-info/fit-check?utm_source=maydalabs&utm_medium=website&utm_campaign=discovery-call-header";

// Canonical primary CTA – matches ProgramsSection
const headerCtaClasses =
  "inline-flex items-center justify-center rounded-full border border-teal-400/70 bg-slate-950/40 px-4 py-2 text-sm font-semibold text-teal-100 shadow-sm shadow-black/30 transition hover:bg-slate-950/80 hover:border-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false); // mobile menu
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0); // 0–1
  const [openMenu, setOpenMenu] = useState<"programs" | "resources" | null>(
    null
  );

  // small delay so dropdown doesn't disappear instantly when moving cursor
  const hoverTimeoutRef = useRef<number | null>(null);

  const openDropdown = (menu: "programs" | "resources") => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setOpenMenu(menu);
  };

  const scheduleCloseDropdown = () => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    hoverTimeoutRef.current = window.setTimeout(() => {
      setOpenMenu(null);
      hoverTimeoutRef.current = null;
    }, 180);
  };

  // Scroll shadow + background tint + progress
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      const doc = document.documentElement;
      const max =
        doc.scrollHeight - window.innerHeight > 0
          ? doc.scrollHeight - window.innerHeight
          : 1;

      setScrolled(y > 4);
      setScrollProgress(Math.min(1, Math.max(0, y / max)));
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  // Cleanup any pending dropdown timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const programsPaths = ["/programs", "/pricing", "/roi-quickcheck"];
  const resourcesPaths = ["/playbooks", "/newsletter"];

  const isProgramsActive =
    !!pathname && programsPaths.some((p) => pathname.startsWith(p));
  const isResourcesActive =
    !!pathname && resourcesPaths.some((p) => pathname.startsWith(p));
  const isCaseStudiesActive = pathname?.startsWith("/case-studies");
  const isAboutActive = pathname?.startsWith("/about");
  const isContactActive = pathname?.startsWith("/contact");

  const desktopLinkBase =
    "inline-flex items-center rounded-full px-3 py-1 text-sm text-slate-300 transition-colors";

  return (
    <header
      className={`sticky top-0 z-40 border-b border-slate-800/70 backdrop-blur-sm transition-shadow ${
        scrolled || open
          ? "bg-slate-950/75 shadow-[0_16px_40px_rgba(0,0,0,0.6)]"
          : "bg-transparent"
      } relative`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6 md:py-4 lg:max-w-7xl lg:px-8">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <Image
            src="/mayda-labs-mark.svg"
            alt="MaydaLabs"
            width={40}
            height={40}
            className="h-10 w-10 opacity-95 transition duration-150 group-hover:drop-shadow-[0_0_18px_rgba(94,234,212,0.9)]"
          />
          <span className="text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-slate-100 md:text-sm">
            MaydaLabs
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-4 md:flex">
          {/* Programs dropdown */}
          <div
            className="relative"
            onMouseEnter={() => openDropdown("programs")}
            onMouseLeave={scheduleCloseDropdown}
          >
            <button
              type="button"
              className={`${desktopLinkBase} ${
                isProgramsActive || openMenu === "programs"
                  ? "bg-slate-900/80 text-slate-50"
                  : "hover:bg-slate-900/60 hover:text-slate-50"
              }`}
            >
              <span>Programs</span>
              <span className="ml-1 text-[0.7rem] opacity-70">▾</span>
            </button>
            {openMenu === "programs" && (
              <div
                className="absolute left-0 top-full mt-1 w-60 rounded-xl border border-slate-800 bg-slate-950/95 p-3 text-sm shadow-[0_18px_45px_rgba(0,0,0,0.7)]"
                onMouseEnter={() => openDropdown("programs")}
                onMouseLeave={scheduleCloseDropdown}
              >
                <div className="space-y-1">
                  <Link
                    href="/programs"
                    className="block rounded-md px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-900/80 hover:text-slate-50"
                  >
                    Programs overview
                  </Link>
                  <Link
                    href="/programs#baseline-scan"
                    className="block rounded-md px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-900/80 hover:text-slate-50"
                  >
                    Baseline Scan
                  </Link>
                  <Link
                    href="/programs#momentum-sprint"
                    className="block rounded-md px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-900/80 hover:text-slate-50"
                  >
                    Momentum Sprint
                  </Link>
                  <Link
                    href="/programs#growth-loop"
                    className="block rounded-md px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-900/80 hover:text-slate-50"
                  >
                    Growth Loop
                  </Link>
                  <div className="mt-2 space-y-1 border-t border-slate-800/70 pt-2">
                    <Link
                      href="/pricing"
                      className="block rounded-md px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-900/80 hover:text-slate-50"
                    >
                      Pricing
                    </Link>
                    <Link
                      href="/roi-quickcheck"
                      className="block rounded-md px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-900/80 hover:text-slate-50"
                    >
                      Advanced ROI Quickcheck
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Case studies */}
          <Link
            href="/case-studies"
            className={`${desktopLinkBase} ${
              isCaseStudiesActive
                ? "bg-slate-900/80 text-slate-50"
                : "hover:bg-slate-900/60 hover:text-slate-50"
            }`}
          >
            Case studies
          </Link>

          {/* Resources dropdown */}
          <div
            className="relative"
            onMouseEnter={() => openDropdown("resources")}
            onMouseLeave={scheduleCloseDropdown}
          >
            <button
              type="button"
              className={`${desktopLinkBase} ${
                isResourcesActive || openMenu === "resources"
                  ? "bg-slate-900/80 text-slate-50"
                  : "hover:bg-slate-900/60 hover:text-slate-50"
              }`}
            >
              <span>Resources</span>
              <span className="ml-1 text-[0.7rem] opacity-70">▾</span>
            </button>
            {openMenu === "resources" && (
              <div
                className="absolute left-0 top-full mt-1 w-52 rounded-xl border border-slate-800 bg-slate-950/95 p-3 text-sm shadow-[0_18px_45px_rgba(0,0,0,0.7)]"
                onMouseEnter={() => openDropdown("resources")}
                onMouseLeave={scheduleCloseDropdown}
              >
                <div className="space-y-1">
                  <Link
                    href="/playbooks"
                    className="block rounded-md px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-900/80 hover:text-slate-50"
                  >
                    Playbooks
                  </Link>
                  <Link
                    href="/newsletter"
                    className="block rounded-md px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-900/80 hover:text-slate-50"
                  >
                    Newsletter
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Simple links */}
          <Link
            href="/about"
            className={`${desktopLinkBase} ${
              isAboutActive
                ? "bg-slate-900/80 text-slate-50"
                : "hover:bg-slate-900/60 hover:text-slate-50"
            }`}
          >
            About
          </Link>
          <Link
            href="/contact"
            className={`${desktopLinkBase} ${
              isContactActive
                ? "bg-slate-900/80 text-slate-50"
                : "hover:bg-slate-900/60 hover:text-slate-50"
            }`}
          >
            Contact
          </Link>

          {/* Header CTA */}
          <Link href={FIT_CHECK_URL} className={headerCtaClasses}>
            Book a discovery call
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 bg-slate-900/80 md:hidden"
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          <span className="sr-only">Toggle navigation</span>
          {/* Proper 3-line hamburger → X */}
          <span className="relative flex h-4 w-4 flex-col items-center justify-between">
            <span
              className={`block h-[2px] w-full rounded-full bg-slate-100 transition-transform ${
                open ? "translate-y-[6px] rotate-45" : ""
              }`}
            />
            <span
              className={`block h-[2px] w-full rounded-full bg-slate-100 transition-all ${
                open ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-[2px] w-full rounded-full bg-slate-100 transition-transform ${
                open ? "-translate-y-[6px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      {/* Scroll progress bar – desktop only */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[2px] md:block">
        <div
          className="h-full origin-left bg-teal-400/80 transition-[transform] duration-150 ease-out"
          style={{ transform: `scaleX(${scrollProgress})` }}
        />
      </div>

      {/* Mobile nav (flattened) */}
      {open && (
        <nav className="border-t border-slate-800 bg-slate-950/98 px-4 pb-4 pt-2 md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 lg:max-w-7xl">
            {/* Programs */}
            <p className="mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Programs
            </p>
            <Link
              href="/programs"
              onClick={() => setOpen(false)}
              className="rounded-md px-1 py-1.5 text-sm text-slate-300 hover:bg-slate-900/70 hover:text-slate-50"
            >
              Programs overview
            </Link>
            <Link
              href="/pricing"
              onClick={() => setOpen(false)}
              className="rounded-md px-1 py-1.5 text-sm text-slate-300 hover:bg-slate-900/70 hover:text-slate-50"
            >
              Pricing
            </Link>
            <Link
              href="/roi-quickcheck"
              onClick={() => setOpen(false)}
              className="rounded-md px-1 py-1.5 text-sm text-slate-300 hover:bg-slate-900/70 hover:text-slate-50"
            >
              Advanced ROI Quickcheck
            </Link>

            {/* Case studies */}
            <p className="mt-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Case studies
            </p>
            <Link
              href="/case-studies"
              onClick={() => setOpen(false)}
              className="rounded-md px-1 py-1.5 text-sm text-slate-300 hover:bg-slate-900/70 hover:text-slate-50"
            >
              View case studies
            </Link>

            {/* Resources */}
            <p className="mt-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Resources
            </p>
            <Link
              href="/playbooks"
              onClick={() => setOpen(false)}
              className="rounded-md px-1 py-1.5 text-sm text-slate-300 hover:bg-slate-900/70 hover:text-slate-50"
            >
              Playbooks
            </Link>
            <Link
              href="/newsletter"
              onClick={() => setOpen(false)}
              className="rounded-md px-1 py-1.5 text-sm text-slate-300 hover:bg-slate-900/70 hover:text-slate-50"
            >
              Newsletter
            </Link>

            {/* Company */}
            <p className="mt-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Company
            </p>
            <Link
              href="/about"
              onClick={() => setOpen(false)}
              className="rounded-md px-1 py-1.5 text-sm text-slate-300 hover:bg-slate-900/70 hover:text-slate-50"
            >
              About
            </Link>
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="rounded-md px-1 py-1.5 text-sm text-slate-300 hover:bg-slate-900/70 hover:text-slate-50"
            >
              Contact
            </Link>

            {/* Mobile CTA */}
            <Link
              href={FIT_CHECK_URL}
              onClick={() => setOpen(false)}
              className={`${headerCtaClasses} mt-3 justify-center`}
            >
              Book a discovery call
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
