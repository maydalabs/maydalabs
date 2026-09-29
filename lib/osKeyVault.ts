import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";

/* A company's own API key, kept sealed.
 *
 * Bringing your own key means the key sits on our server. It is stored only
 * as AES-256-GCM ciphertext under a secret that lives in the deployment
 * environment and nowhere in the database, so a dump of the database is a
 * dump of nothing usable. The last four characters are kept beside it so a
 * person can recognise which key they stored without ever seeing it again.
 */

type Env = Record<string, string | undefined>;

const VERSION = "v1";

/** The 32-byte key derived from MAYDAOS_KEY_SECRET, or null when unset.
 * Derived by hashing rather than decoded, so any secret of at least 32
 * characters works and a short one is refused. */
export function vaultSecret(env: Env = process.env): Buffer | null {
  const secret = env.MAYDAOS_KEY_SECRET?.trim();
  if (!secret || secret.length < 32) return null;
  return createHash("sha256").update(secret).digest();
}

/** Trim, and refuse anything that cannot be an API key. Never logged. */
export function normalizeApiKey(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const key = raw.trim();
  if (key.length < 16 || key.length > 512 || /\s/.test(key)) return null;
  return key;
}

export function keyLast4(key: string): string {
  return key.slice(-4);
}

export function sealKey(key: string, env: Env = process.env): { ciphertext: string; last4: string } {
  const secret = vaultSecret(env);
  if (!secret) throw new Error("vault_locked");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secret, iv);
  const data = Buffer.concat([cipher.update(key, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { ciphertext: `${VERSION}:${Buffer.concat([iv, tag, data]).toString("base64")}`, last4: keyLast4(key) };
}

/** The key back, or null when the secret is missing, changed, or the
 * ciphertext was tampered with. Never throws the reason: a caller reports
 * "the vault is locked", not which byte was wrong. */
export function openKey(ciphertext: string, env: Env = process.env): string | null {
  const secret = vaultSecret(env);
  if (!secret) return null;
  const [version, body] = ciphertext.split(":");
  if (version !== VERSION || !body) return null;
  let raw: Buffer;
  try { raw = Buffer.from(body, "base64"); } catch { return null; }
  if (raw.length < 12 + 16 + 1) return null;
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const data = raw.subarray(28);
  try {
    const decipher = createDecipheriv("aes-256-gcm", secret, iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
    return normalizeApiKey(plain);
  } catch {
    return null;
  }
}

/** Constant-time comparison for the rare place a key is compared. */
export function sameKey(a: string, b: string): boolean {
  const left = Buffer.from(a); const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
