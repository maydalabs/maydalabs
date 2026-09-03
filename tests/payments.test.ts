import { describe, expect, it } from "vitest";
import { bitcoinAddressKind, isValidBitcoinAddress } from "@/lib/bitcoinAddress";
import { bip21Uri, formatBtc, formatSats, invoiceState, satsFromUsd } from "@/lib/payments";

/* Address vectors: the BIP173/BIP350 examples plus well-known mainnet
 * addresses. Nothing here is a MaydaLabs address. */
describe("bitcoinAddressKind", () => {
  it("accepts valid mainnet addresses of every kind", () => {
    expect(bitcoinAddressKind("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa")).toBe("p2pkh");
    expect(bitcoinAddressKind("3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy")).toBe("p2sh");
    expect(bitcoinAddressKind("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4")).toBe("p2wpkh");
    expect(bitcoinAddressKind("bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3")).toBe("p2wsh");
    expect(bitcoinAddressKind("bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0")).toBe("p2tr");
  });

  it("rejects a single mistyped character", () => {
    // Last character changed: shape is fine, checksum is not.
    expect(isValidBitcoinAddress("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t5")).toBe(false);
    expect(isValidBitcoinAddress("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNb")).toBe(false);
  });

  it("rejects testnet, other chains, and junk", () => {
    expect(isValidBitcoinAddress("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx")).toBe(false);
    expect(isValidBitcoinAddress("mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn")).toBe(false);
    expect(isValidBitcoinAddress("0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B")).toBe(false);
    expect(isValidBitcoinAddress("")).toBe(false);
    expect(isValidBitcoinAddress("not an address")).toBe(false);
  });

  it("rejects mixed-case bech32, which the specification forbids", () => {
    expect(isValidBitcoinAddress("bc1QW508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4")).toBe(false);
  });

  it("tolerates surrounding whitespace from a paste", () => {
    expect(isValidBitcoinAddress("  bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4  ")).toBe(true);
  });
});

describe("money", () => {
  it("rounds sats up so an invoice is never short", () => {
    expect(satsFromUsd(2500, 100000)).toBe(2_500_000);
    expect(satsFromUsd(1, 3)).toBe(33_333_334);
    expect(satsFromUsd(0, 100000)).toBe(0);
    expect(satsFromUsd(2500, 0)).toBe(0);
  });

  it("formats amounts the way wallets expect", () => {
    expect(formatBtc(2_500_000)).toBe("0.02500000");
    expect(formatSats(2_500_000)).toBe("2 500 000");
    expect(bip21Uri("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4", 2_500_000, "Pilot fee")).toBe(
      "bitcoin:bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4?amount=0.02500000&message=Pilot+fee",
    );
  });
});

describe("invoiceState", () => {
  const future = new Date(Date.now() + 3_600_000).toISOString();
  const past = new Date(Date.now() - 3_600_000).toISOString();

  it("reports paid and void regardless of the clock", () => {
    expect(invoiceState({ status: "paid", amountSats: 100, observedSats: 100, expiresAt: past })).toBe("paid");
    expect(invoiceState({ status: "void", amountSats: 100, observedSats: 0, expiresAt: future })).toBe("void");
  });

  it("calls a partial payment underpaid, even after expiry", () => {
    expect(invoiceState({ status: "open", amountSats: 100, observedSats: 40, expiresAt: past })).toBe("underpaid");
  });

  it("expires an untouched invoice once the deadline passes", () => {
    expect(invoiceState({ status: "open", amountSats: 100, observedSats: 0, expiresAt: past })).toBe("expired");
    expect(invoiceState({ status: "open", amountSats: 100, observedSats: 0, expiresAt: future })).toBe("open");
  });
});
