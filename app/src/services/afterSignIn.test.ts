import { rememberReturn, takeReturn } from './afterSignIn';

const store = new Map<string, string>();
globalThis.localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) } as Storage;
globalThis.location = { hash: '#/oracle' } as Location;

describe('after sign-in', () => {
  it('returns to the page and plan once, then forgets', () => {
    rememberReturn('yearly');
    expect(takeReturn()).toMatchObject({ hash: '#/oracle', plan: 'yearly' });
    expect(takeReturn()).toBeNull();
  });
  it('ignores a return saved long ago', () => {
    rememberReturn('monthly');
    expect(takeReturn(Date.now() + 60 * 60 * 1000)).toBeNull();
  });
});
