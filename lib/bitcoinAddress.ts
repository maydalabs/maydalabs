/* Mainnet bitcoin address validation, checksum included.
 *
 * An invoice is only as good as its address: a mistyped one sends the
 * client's money nowhere recoverable. A shape regex is not enough, so this
 * verifies the real checksum — bech32/bech32m for `bc1…` (BIP173/BIP350)
 * and Base58Check for `1…`/`3…`. Mainnet only; testnet and other chains
 * are rejected rather than quietly accepted.
 *
 * Pure except for the SHA-256 in Base58Check, so it runs on the server and
 * in tests without a wallet library.
 */

import { createHash } from "node:crypto";

const BECH32_CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
const GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
const BECH32_CONST = 1;
const BECH32M_CONST = 0x2bc830a3;
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export type AddressKind = "p2pkh" | "p2sh" | "p2wpkh" | "p2wsh" | "p2tr";

function polymod(values: number[]): number {
  let checksum = 1;
  for (const value of values) {
    const top = checksum >> 25;
    checksum = ((checksum & 0x1ffffff) << 5) ^ value;
    for (let i = 0; i < 5; i += 1) if ((top >> i) & 1) checksum ^= GENERATOR[i];
  }
  return checksum;
}

function hrpExpand(hrp: string): number[] {
  const high: number[] = [];
  const low: number[] = [];
  for (const char of hrp) {
    high.push(char.charCodeAt(0) >> 5);
    low.push(char.charCodeAt(0) & 31);
  }
  return [...high, 0, ...low];
}

/* 5-bit groups to 8-bit bytes, rejecting invalid padding. */
function convertBits(data: number[], from: number, to: number): number[] | null {
  let accumulator = 0;
  let bits = 0;
  const out: number[] = [];
  const maxValue = (1 << to) - 1;
  for (const value of data) {
    if (value < 0 || value >> from !== 0) return null;
    accumulator = (accumulator << from) | value;
    bits += from;
    while (bits >= to) {
      bits -= to;
      out.push((accumulator >> bits) & maxValue);
    }
  }
  if (bits >= from || ((accumulator << (to - bits)) & maxValue) !== 0) return null;
  return out;
}

function parseBech32(address: string): AddressKind | null {
  // Mixed case is invalid by specification; normalise only when uniform.
  if (address !== address.toLowerCase() && address !== address.toUpperCase()) return null;
  const value = address.toLowerCase();
  if (value.length < 14 || value.length > 90) return null;
  const separator = value.lastIndexOf("1");
  if (separator < 1 || separator + 7 > value.length) return null;

  const hrp = value.slice(0, separator);
  if (hrp !== "bc") return null; // mainnet only

  const data: number[] = [];
  for (const char of value.slice(separator + 1)) {
    const index = BECH32_CHARSET.indexOf(char);
    if (index === -1) return null;
    data.push(index);
  }

  const checksum = polymod([...hrpExpand(hrp), ...data]);
  const version = data[0];
  if (version === undefined || version > 16) return null;
  // Witness v0 is bech32; v1 and above are bech32m.
  const expected = version === 0 ? BECH32_CONST : BECH32M_CONST;
  if (checksum !== expected) return null;

  const program = convertBits(data.slice(1, data.length - 6), 5, 8);
  if (!program || program.length < 2 || program.length > 40) return null;
  if (version === 0) {
    if (program.length === 20) return "p2wpkh";
    if (program.length === 32) return "p2wsh";
    return null;
  }
  if (version === 1 && program.length === 32) return "p2tr";
  return null;
}

function base58Decode(input: string): Uint8Array | null {
  const bytes: number[] = [0];
  for (const char of input) {
    const value = BASE58_ALPHABET.indexOf(char);
    if (value === -1) return null;
    let carry = value;
    for (let i = 0; i < bytes.length; i += 1) {
      carry += bytes[i] * 58;
      bytes[i] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  // Leading '1's are leading zero bytes.
  for (const char of input) {
    if (char !== "1") break;
    bytes.push(0);
  }
  return Uint8Array.from(bytes.reverse());
}

function sha256(data: Uint8Array): Uint8Array {
  return Uint8Array.from(createHash("sha256").update(data).digest());
}

function parseBase58Check(address: string): AddressKind | null {
  if (address.length < 26 || address.length > 35) return null;
  const decoded = base58Decode(address);
  if (!decoded || decoded.length !== 25) return null;

  const payload = decoded.subarray(0, 21);
  const checksum = decoded.subarray(21);
  const expected = sha256(sha256(payload)).subarray(0, 4);
  for (let i = 0; i < 4; i += 1) if (checksum[i] !== expected[i]) return null;

  if (payload[0] === 0x00) return "p2pkh"; // mainnet, starts with 1
  if (payload[0] === 0x05) return "p2sh"; // mainnet, starts with 3
  return null; // testnet and everything else
}

/* The address kind when it is a valid mainnet address, otherwise null. */
export function bitcoinAddressKind(raw: string): AddressKind | null {
  const address = raw.trim();
  if (!address || /\s/.test(address)) return null;
  if (address.toLowerCase().startsWith("bc1")) return parseBech32(address);
  if (address.startsWith("1") || address.startsWith("3")) return parseBase58Check(address);
  return null;
}

export function isValidBitcoinAddress(raw: string): boolean {
  return bitcoinAddressKind(raw) !== null;
}
