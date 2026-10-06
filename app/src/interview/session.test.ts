import { interviewRequested, start, markStep, load, summary, visibleLenses, update } from './session';

const mem = new Map<string, string>();
globalThis.sessionStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
} as Storage;

describe('interview mode', () => {
  it('turns on only when asked for in the address', () => {
    expect(interviewRequested('https://x.io/within/?interview')).toBe(true);
    expect(interviewRequested('https://x.io/within/#/today?interview=1')).toBe(true);
    expect(interviewRequested('https://x.io/within/#/today')).toBe(false);
  });

  it('times steps once each and summarizes without free text', () => {
    start('vedic', 1_000);
    markStep(6, 61_000);
    markStep(6, 99_000);
    markStep(7, 181_000);
    update((s) => ({ ...s, finishedAt: 200_000, choice: 'pause', ratings: { meaning: 'accurate', fact: 'partly' } }));
    const s = load()!;
    expect(s.steps[6]).toBe(60_000);
    const text = summary(s);
    expect(text).toMatch(/lens: vedic/);
    expect(text).toMatch(/Setup to first reflection: 60s/);
    expect(text).toMatch(/Time on first reflection: 120s/);
    expect(text).toMatch(/Chose: pause/);
    expect(text).toMatch(/next: —/);
  });

  it('shows one lens or both, keeping the randomized order', () => {
    const s = start('both');
    expect(visibleLenses(['vedic', 'western'], s)).toEqual(['vedic', 'western']);
    expect(visibleLenses(['vedic', 'western'], { ...s, lens: 'western' })).toEqual(['western']);
    expect(visibleLenses(['western', 'vedic'], null)).toEqual(['western', 'vedic']);
  });
});
