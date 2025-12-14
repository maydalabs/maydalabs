import Link from "next/link";

const DISCOVERY_CALL_URL =
  "https://calendly.com/emayda-info/fit-check?utm_source=maydalabs&utm_medium=website&utm_campaign=announcement-strip";

export function AnnouncementStrip() {
  return (
    <div className="border-b border-slate-800/80 bg-slate-950/60 text-[0.78rem] text-slate-200 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
        <Link
          href={DISCOVERY_CALL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 py-2.5 text-[0.8rem] text-slate-200 hover:text-teal-100"
        >
          {/* Pill label */}
          <span className="inline-flex items-center rounded-full border border-teal-400/60 bg-slate-900/90 px-3 py-[3px] text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-teal-200">
            Discovery call
          </span>

          {/* Text */}
          <span className="inline-flex items-center gap-1 text-[0.8rem] font-medium">
            <span>Free 15min call. We’ll spot 2–3 quick wins.</span>
            <span className="text-slate-400 transition-transform duration-150 group-hover:translate-x-0.5">
              ↗
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
}
