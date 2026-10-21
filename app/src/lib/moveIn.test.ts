import { decodeMove, fuller } from './moveIn';

const b64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const state = { onboarded: true, oracle: [{ question: 'Why am I emotional today?' }], journal: ['é ✦ 🌕'] };

describe('decodeMove', () => {
  it('reads the gzip payload the bridge makes', async () => {
    const z = new Uint8Array(await new Response(new Blob([JSON.stringify(state)]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
    expect(await decodeMove(`g.${b64(z)}`)).toEqual(state);
  });
  it('reads the plain payload for browsers without compression', async () => {
    expect(await decodeMove(`r.${b64(new TextEncoder().encode(JSON.stringify(state)))}`)).toEqual(state);
  });
  it('rejects anything else', async () => {
    await expect(decodeMove('x.abc')).rejects.toThrow();
  });
});

it('keeps the fuller saved app', () => {
  expect(fuller(null, state)).toBe(state);
  expect(fuller(state, { onboarded: true })).toBe(state);
});
