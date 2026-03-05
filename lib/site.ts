const FALLBACK_SITE_URL = "https://maydalabs.com";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || FALLBACK_SITE_URL
).replace(/\/+$/, "");
