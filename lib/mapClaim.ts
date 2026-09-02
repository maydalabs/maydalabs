/*
 * Anonymous Multiplier Map claim flow. The browser keeps a random token in
 * an httpOnly cookie; the database stores only the SHA-256 hash. Signing in
 * later lets the server attach those rows to the new session's user.
 */

export const MAP_CLAIM_COOKIE = "ml_map_claim";

export const MAP_CLAIM_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
} as const;
