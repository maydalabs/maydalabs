"use client";

import { track } from "@vercel/analytics/react";

type Properties = Record<string, string | number | boolean | null>;

declare global {
  interface Window {
    dataLayer: Array<Record<string, unknown>>;
  }
}

// One event funnel, mirrored into GTM's dataLayer and Vercel Analytics.
// Payloads carry interface state only — option ids, step numbers, surface
// names — never free-typed input or personal data.
export function trackEvent(name: string, properties: Properties) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...properties });
  track(name, properties);
}
