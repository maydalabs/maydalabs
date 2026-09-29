import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { keyLast4, normalizeApiKey, openKey, sameKey, sealKey, vaultSecret } from "@/lib/osKeyVault";

type Env = Record<string, string | undefined>;
const env: Env = { MAYDAOS_KEY_SECRET: "a-long-enough-secret-for-the-vault-0123456789" };

describe("the key vault", () => {
  it("refuses to work without a secret of at least 32 characters", () => {
    expect(vaultSecret({})).toBeNull();
    expect(vaultSecret({ MAYDAOS_KEY_SECRET: "short" })).toBeNull();
    expect(() => sealKey("sk-ant-api03-abcdefghijklmnop", {})).toThrow("vault_locked");
    expect(openKey("v1:anything", {})).toBeNull();
  });

  it("seals a key so only the same secret opens it, and keeps the last four in the clear", () => {
    const key = "sk-ant-api03-abcdefghijklmnopqrstuvwxyz";
    const sealed = sealKey(key, env);
    expect(sealed.last4).toBe("wxyz");
    expect(sealed.ciphertext.startsWith("v1:")).toBe(true);
    expect(sealed.ciphertext).not.toContain("abcdefghijklmnop");
    expect(openKey(sealed.ciphertext, env)).toBe(key);
    expect(openKey(sealed.ciphertext, { MAYDAOS_KEY_SECRET: "a-different-secret-that-is-also-long-enough-000" })).toBeNull();
  });

  it("does not open ciphertext that was altered, shortened or versioned differently", () => {
    const sealed = sealKey("xai-0123456789abcdefghijklmnop", env).ciphertext;
    const body = sealed.slice(3);
    const flipped = Buffer.from(body, "base64");
    flipped[flipped.length - 1] ^= 0x01;
    expect(openKey(`v1:${flipped.toString("base64")}`, env)).toBeNull();
    expect(openKey(`v2:${body}`, env)).toBeNull();
    expect(openKey("v1:AAAA", env)).toBeNull();
    expect(openKey("", env)).toBeNull();
  });

  it("normalises what a person pastes and refuses what cannot be a key", () => {
    expect(normalizeApiKey("  sk-test-abcdefghijklmnop \n")).toBe("sk-test-abcdefghijklmnop");
    expect(normalizeApiKey("too short")).toBeNull();
    expect(normalizeApiKey("has a space inside the key value")).toBeNull();
    expect(normalizeApiKey("x".repeat(513))).toBeNull();
    expect(normalizeApiKey(42)).toBeNull();
    expect(keyLast4("sk-abcdefghijk1234")).toBe("1234");
  });

  it("compares keys in constant time without throwing on different lengths", () => {
    expect(sameKey("abc", "abc")).toBe(true);
    expect(sameKey("abc", "abcd")).toBe(false);
  });
});
