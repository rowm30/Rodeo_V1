import { formatPublicId, makeDisplayName } from './identity';

test('formatPublicId removes vowels and adds prefix', () => {
  const id = formatPublicId('aabbccddeeff00112233445566778899');
  expect(id.startsWith('RDO-')).toBe(true);
  expect(id.length).toBe(13);
});

test('makeDisplayName deterministic', () => {
  const name1 = makeDisplayName('001122334455');
  const name2 = makeDisplayName('001122334455');
  expect(name1).toBe(name2);
});
