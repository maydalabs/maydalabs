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

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 8000); // 8s per slide – calm
    return () => clearInterval(id);
  }, []);

  return (
    <div className="announcement">
      <div className="announcement-inner">
        <div className="announcement-window">
          <div
            className="announcement-track"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {ANNOUNCEMENTS.map((item) => (
              <div key={item.label} className="announcement-item">
                <span className="announcement-label">{item.label}</span>
                <Link
                  href={item.href}
                  className="announcement-text announcement-text-link"
                >
                  {item.text}
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="announcement-cta">
          <Link href="https://calendly.com/" className="announcement-link">
            Book a 15min fit check
          </Link>
        </div>
      </div>
    </div>
  );
}
