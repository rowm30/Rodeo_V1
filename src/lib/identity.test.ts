import { formatPublicId, makeDisplayName } from './identity';
import adjectives from './wordlists/genz_adjectives';
import nouns from './wordlists/genz_nouns';

describe('identity helpers', () => {
  it('formats public id without vowels', () => {
    const hash = new Uint8Array(32);
    for (let i = 0; i < hash.length; i++) hash[i] = i;
    const id = formatPublicId(hash);
    expect(id.startsWith('RDO-')).toBe(true);
    expect(id.length).toBe(14);
    expect(id).not.toMatch(/[AEIOU]/);
  });

  it('generates deterministic display name', () => {
    const hash = new Uint8Array([1, 2]);
    const name = makeDisplayName(hash);
    const expected = `${adjectives[1 % adjectives.length]}-${nouns[2 % nouns.length]}`;
    expect(name).toBe(expected);
  });
});
