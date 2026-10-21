/**
 * Arriving from the old address (public/bridge.html) with the saved app in the #fragment: save it in this
 * address's vault, then clear it from the address bar. If this device already has a saved app here too,
 * the fuller one is kept.
 */
import { deviceVault } from '../storage/vault';

const VAULT_KEY = 'state.v1';

function bytes(b64: string): Uint8Array<ArrayBuffer> {
  const s = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

/** Reads the fragment's payload: "g." for gzip, "r." for plain JSON bytes. */
export async function decodeMove(payload: string): Promise<unknown> {
  const [kind, data] = [payload.slice(0, 2), payload.slice(2)];
  let raw: Uint8Array<ArrayBuffer> = bytes(data);
  if (kind === 'g.') raw = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
  else if (kind !== 'r.') throw new Error('Unknown format');
  return JSON.parse(new TextDecoder().decode(raw));
}

/** The saved app with more in it: answers, journal entries, people. */
export const fuller = (a: unknown, b: unknown) => (JSON.stringify(b ?? null).length > JSON.stringify(a ?? null).length ? b : a);

export async function moveIn(): Promise<void> {
  const m = location.hash.match(/^#import=([A-Za-z0-9_.-]+)$/);
  if (!m) return;
  history.replaceState(null, '', `${location.pathname}${location.search}#/`);
  try {
    const vault = deviceVault();
    if (!vault) return;
    const moved = await decodeMove(m[1]);
    if (!moved || typeof moved !== 'object' || !(moved as { onboarded?: boolean }).onboarded) return;
    const here = await vault.load(VAULT_KEY);
    if (fuller(here, moved) === moved) await vault.save(VAULT_KEY, moved);
  } catch {
    // A move that can't be read is skipped: the old address still has everything.
  }
}
