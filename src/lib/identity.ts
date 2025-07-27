import adjectives from './wordlists/genz_adjectives';
import nouns from './wordlists/genz_nouns';

function base32NoPadding(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }
  return output;
}

export function formatPublicId(hash: Uint8Array): string {
  const raw = base32NoPadding(hash.slice(0, 10)).toUpperCase();
  const filtered = raw.replace(/[AEIOU]/g, '');
  const code = filtered.slice(0, 9).padEnd(9, 'X');
  return `RDO-${code.slice(0, 5)}-${code.slice(5)}`;
}

export function makeDisplayName(hash: Uint8Array, offset = 0): string {
  const idxA = hash[offset % hash.length] % adjectives.length;
  const idxB = hash[(offset + 1) % hash.length] % nouns.length;
  return `${adjectives[idxA]}-${nouns[idxB]}`;
}
