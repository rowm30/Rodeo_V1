import { adjectives } from './wordlists/genz_adjectives';
import { nouns } from './wordlists/genz_nouns';

/**
 * Format a public ID from the SHA-256 thumbprint of the device public key.
 * The input should already be a hex or base64url string.
 */
export function formatPublicId(thumbprint: string): string {
  // Use first 10 bytes of hash, base32 encoded without vowels
  const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes = new Uint8Array(
    thumbprint
      .toLowerCase()
      .replace(/[^0-9a-f]/g, '')
      .match(/.{1,2}/g)!
      .map((b) => parseInt(b, 16)),
  );

  // convert to 5-bit groups
  const bits: number[] = [];
  for (const byte of bytes.slice(0, 10)) {
    for (let i = 7; i >= 0; i--) {
      bits.push((byte >> i) & 1);
    }
  }
  const chars: string[] = [];
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5);
    while (chunk.length < 5) chunk.push(0);
    const idx = chunk.reduce((acc, bit) => (acc << 1) | bit, 0);
    chars.push(base32Alphabet[idx]);
  }
  const base32 = chars.join('');
  const noVowels = base32.replace(/[AEIOU]/gi, '');
  const id = noVowels.slice(0, 8).replace(/(.{4})/, '$1-');
  return `RDO-${id.slice(0, 4)}-${id.slice(5, 9)}`;
}

/**
 * Deterministically create a display name from hash bytes and optional offset.
 */
export function makeDisplayName(hash: string, offset = 0): string {
  const bytes = new Uint8Array(
    hash
      .toLowerCase()
      .replace(/[^0-9a-f]/g, '')
      .match(/.{1,2}/g)!
      .map((b) => parseInt(b, 16)),
  );
  const adjIndex = (bytes[0] + offset) % adjectives.length;
  const nounIndex = (bytes[1] + offset) % nouns.length;
  return `${adjectives[adjIndex]}-${nouns[nounIndex]}`;
}
