/* Reading the pages a person hands MaydaOS.
 *
 * Fetching arbitrary URLs on behalf of a signed-in stranger is a
 * server-side request forgery hole unless it is guarded: every hostname is
 * resolved first and anything pointing at a private, loopback, or
 * link-local address is refused, so nobody can use the beta as a window
 * into our own network. Responses are capped and stripped to text.
 */

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { OS_SOURCE_CHAR_LIMIT } from "@/lib/os";

const FETCH_TIMEOUT_MS = 10_000;
const MAX_BYTES = 512 * 1024;

export type FetchedSource = {
  url: string;
  title: string;
  text: string;
  chars: number;
};

export type SourceFailure = { url: string; reason: string };

/* Private, loopback, link-local, carrier-grade NAT and unique-local ranges. */
function isPrivateAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) {
    const [a, b] = address.split(".").map(Number);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }
  if (family === 6) {
    const value = address.toLowerCase();
    if (value === "::1" || value === "::") return true;
    if (value.startsWith("fe80") || value.startsWith("fc") || value.startsWith("fd")) return true;
    // IPv4-mapped, e.g. ::ffff:127.0.0.1
    const mapped = value.split(":").pop();
    if (mapped && isIP(mapped) === 4) return isPrivateAddress(mapped);
    return false;
  }
  return true;
}

async function hostIsPublic(hostname: string): Promise<boolean> {
  if (isIP(hostname)) return !isPrivateAddress(hostname);
  try {
    const records = await lookup(hostname, { all: true });
    if (records.length === 0) return false;
    return records.every((record) => !isPrivateAddress(record.address));
  } catch {
    return false;
  }
}

function stripHtml(html: string): { title: string; text: string } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeEntities(titleMatch[1]).trim().slice(0, 200) : "";
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return { title, text: decodeEntities(body).replace(/\s+/g, " ").trim() };
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

export async function fetchSource(url: string): Promise<FetchedSource | SourceFailure> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { url, reason: "not a URL" };
  }
  if (!(await hostIsPublic(parsed.hostname))) {
    return { url, reason: "host is not publicly routable" };
  }

  try {
    const response = await fetch(parsed.toString(), {
      redirect: "error", // a redirect could land on a private address
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { accept: "text/html,text/plain;q=0.9,*/*;q=0.1", "user-agent": "MaydaOS/beta (+https://maydalabs.com)" },
    });
    if (!response.ok) return { url, reason: `the page returned ${response.status}` };

    const type = response.headers.get("content-type") ?? "";
    if (!type.includes("text/html") && !type.includes("text/plain")) {
      return { url, reason: "not a text page" };
    }

    const buffer = await response.arrayBuffer();
    const raw = new TextDecoder().decode(buffer.slice(0, MAX_BYTES));
    const { title, text } = type.includes("text/html")
      ? stripHtml(raw)
      : { title: "", text: raw.replace(/\s+/g, " ").trim() };

    if (text.length < 200) return { url, reason: "too little readable text" };
    const clipped = text.slice(0, OS_SOURCE_CHAR_LIMIT);
    return { url, title: title || parsed.hostname, text: clipped, chars: clipped.length };
  } catch {
    return { url, reason: "could not be read" };
  }
}

export function isFailure(value: FetchedSource | SourceFailure): value is SourceFailure {
  return "reason" in value;
}
