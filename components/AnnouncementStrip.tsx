"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

type AnnouncementItem = {
  label: string; // internal key / pill text
  text: string;
  href?: string;
  kind?: "default" | "bitcoin";
};

const ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    label: "ROI quickcheck",
    text: "Estimate your upside before you change anything.",
    href: "/roi-quickcheck",
  },
  {
    label: "Free",
    text: "Book a 15min fit check.",
    href: "https://calendly.com/emayda-info/fit-check?utm_source=maydalabs&utm_medium=website&utm_campaign=announcement-strip",
  },
  {
    // label is just the key here, pill hidden
    label: "Bitcoin",
    text: "Accepting payments in Bitcoin.",
    href: "/pricing",
    kind: "bitcoin",
  },
];

export function AnnouncementStrip() {
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-advance, pause on hover
  useEffect(() => {
    if (isHovered) return;

    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 4500);

    return () => clearInterval(id);
  }, [isHovered]);

  return (
    <div className="border-b border-slate-800/80 bg-slate-950/40 text-[0.75rem] text-slate-400 backdrop-blur">
      <div className="mx-auto flex min-h-[34px] max-w-6xl items-center justify-center px-4 sm:px-6">
        <div
          className="relative flex w-full max-w-2xl overflow-hidden"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          aria-live="polite"
        >
          <div
            className="flex w-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {ANNOUNCEMENTS.map((item) => {
              const isBitcoin = item.kind === "bitcoin";

              const content = (
                <div className="flex min-w-full items-center justify-center gap-3 px-2">
                  {/* Left: pill or BTC icon */}
                  <span className="inline-flex items-center gap-2">
                    {!isBitcoin && (
                      <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/80 px-2 py-[2px] text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-teal-200">
                        {item.label}
                      </span>
                    )}

                    {isBitcoin && (
                      <span className="inline-flex h-4 w-4 items-center justify-center">
                        <Image
                          src="/btc-logo.png"
                          alt="Bitcoin"
                          width={16}
                          height={16}
                          className="opacity-80"
                        />
                      </span>
                    )}
                  </span>

                  {/* Main text */}
                  <span className="text-[0.78rem] font-medium text-slate-200">
                    {item.text}
                  </span>
                </div>
              );

              return (
                <div
                  key={item.label}
                  className="flex min-w-full justify-center"
                >
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="group inline-flex items-center justify-center hover:text-teal-200"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
