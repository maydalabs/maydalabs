"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AnnouncementItem = {
  label: string;
  text: string;
  href: string;
};

const ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    label: "Fit check",
    text: "Free 15min call. We’ll identify 2–3 quick wins.",
    href: "https://calendly.com/", // TODO: real Calendly link
  },
  {
    label: "ROI quickcheck",
    text: "Estimate your upside before you change anything.",
    href: "/roi-quickcheck",
  },
  {
    label: "Bitcoin-friendly",
    text: "Pay via Bitcoin or card. Built for modern stacks.",
    href: "/pricing",
  },
];

export function AnnouncementStrip() {
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-advance, but pause when hovered
  useEffect(() => {
    if (isHovered) return;

    const id = setInterval(
      () => setIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length),
      8000
    );

    return () => clearInterval(id);
  }, [isHovered]);

  return (
    <div className="border-b border-border/70 bg-background/80 text-[0.78rem] text-muted backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-2 md:px-6">
        {/* Sliding window */}
        <div
          className="relative flex-1 overflow-hidden"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {ANNOUNCEMENTS.map((item) => (
              <div
                key={item.label}
                className="flex min-w-full items-center gap-2"
              >
                <span className="inline-flex items-center rounded-full border border-border px-2 py-[2px] text-[0.65rem] uppercase tracking-[0.16em] text-foreground">
                  {item.label}
                </span>
                <Link
                  href={item.href}
                  className="truncate border-b border-dotted border-slate-500/70 pb-[1px] text-muted transition-colors hover:border-transparent hover:text-foreground"
                >
                  {item.text}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Right-side CTA */}
        <div className="ml-auto w-full flex-shrink-0 md:ml-4 md:w-auto">
          <Link
            href="https://calendly.com/"
            className="inline-flex w-full items-center justify-center rounded-full border border-mayda-teal bg-mayda-teal/10 px-3 py-1.5 text-[0.78rem] font-medium text-foreground shadow-sm hover:bg-mayda-teal/20 md:w-auto"
          >
            Book a 15min fit check
          </Link>
        </div>
      </div>
    </div>
  );
}
