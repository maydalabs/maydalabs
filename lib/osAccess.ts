/* Who may spend a credit.
 *
 * The beta runs on a MaydaLabs API balance, so "signed in" is not the same
 * as "allowed to spend". While the balance is small, or shared with
 * something that matters more, MAYDAOS_ALLOWLIST holds the emails that may
 * run. Unset means the beta is open to anyone signed in.
 */

export function osAllowlist(): string[] {
  return (process.env.MAYDAOS_ALLOWLIST ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function isOsInviteOnly(): boolean {
  return osAllowlist().length > 0;
}

export function isOsAllowed(email: unknown): boolean {
  const list = osAllowlist();
  if (list.length === 0) return true;
  return typeof email === "string" && list.includes(email.trim().toLowerCase());
}
