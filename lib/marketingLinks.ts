export const CALENDLY_INTRO_CALL_BASE = "https://calendly.com/maydalabs-info/30min";

const DEFAULT_INTRO_CALL_UTMS = {
  utm_source: "maydalabs",
  utm_medium: "website",
  utm_campaign: "intro_call",
} as const;

export function appendUrlParams(
  baseUrl: string,
  params: Record<string, string>,
): string {
  const url = new URL(baseUrl);

  for (const [key, value] of Object.entries(params)) {
    if (!value) continue;
    url.searchParams.set(key, value);
  }

  return url.toString();
}

export function getIntroCallUrl(
  surface: string,
  extraParams: Record<string, string> = {},
): string {
  return appendUrlParams(CALENDLY_INTRO_CALL_BASE, {
    ...DEFAULT_INTRO_CALL_UTMS,
    utm_content: surface,
    ...extraParams,
  });
}
