import { timingSafeEqual } from "node:crypto";

/* Who is allowed to start the worker.
 *
 * Kept out of the route handler so it can be tested directly. A check that
 * is only ever exercised through a live endpoint gets tested the easy way —
 * "it refused a bad token" — and that assertion passes just as well when the
 * endpoint refuses everything, including the caller it exists for.
 */
export function isCronAuthorized(authorizationHeader: string | null, secret: string | undefined): boolean {
  // No secret configured means nothing is authorized. An open URL that spends
  // money on model calls is a bill waiting to be run up by whoever finds it.
  if (!secret) return false;

  const offered = Buffer.from(authorizationHeader ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);

  // Constant time, and length first because timingSafeEqual throws on a
  // mismatch — the length of a secret is not the part worth hiding.
  return offered.length === expected.length && timingSafeEqual(offered, expected);
}
