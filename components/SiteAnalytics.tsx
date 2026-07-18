"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics/react";

type EventProperties = Record<string, string | number | boolean | null>;
type ClassifiedClick = {
  name: string;
  properties: EventProperties;
};

declare global {
  interface Window {
    dataLayer: Array<Record<string, unknown>>;
  }
}

function getProject(pathname: string) {
  if (pathname === "/case-studies" || pathname === "/case-studies/") {
    return "work_index";
  }

  return pathname.split("/").filter(Boolean).at(-1) ?? "work_index";
}

function classifyClick(url: URL): ClassifiedClick | null {
  if (url.hostname.endsWith("calendly.com")) {
    return {
      name: "project_call_click",
      properties: { surface: url.searchParams.get("utm_content") ?? "unknown" },
    };
  }

  if (url.protocol === "mailto:") {
    return {
      name: "email_click",
      properties: { address: url.pathname.toLowerCase() },
    };
  }

  if (url.hostname.endsWith("linkedin.com")) {
    return {
      name: "social_click",
      properties: { network: "linkedin" },
    };
  }

  const flagship = ["hodlstay.com", "satoshigazette.org"].find(
    (domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`),
  );

  if (flagship) {
    return {
      name: "flagship_outbound",
      properties: { project: flagship.split(".")[0] },
    };
  }

  if (url.origin === window.location.origin && url.pathname.startsWith("/case-studies")) {
    return {
      name: "case_study_click",
      properties: { project: getProject(url.pathname) },
    };
  }

  if (url.origin === window.location.origin && url.pathname === "/contact") {
    return {
      name: "contact_page_click",
      properties: { surface: window.location.pathname },
    };
  }

  return null;
}

function emit(name: string, properties: EventProperties) {
  window.dataLayer.push({ event: name, ...properties });
  track(name, properties);
}

export function SiteAnalytics() {
  useEffect(() => {
    window.dataLayer = window.dataLayer || [];

    const handleClick = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest<HTMLAnchorElement>("a[href]");

      if (!anchor) {
        return;
      }

      const classified = classifyClick(new URL(anchor.href, window.location.href));

      if (classified) {
        emit(classified.name, classified.properties);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
