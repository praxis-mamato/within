import { computeNatal } from '../astro/natal';
import { composite, davison, kootas, relationshipTimeline, type VedicSide } from '../astro/relationship';
import { lint } from './lint';
import * as R from './relationship';
import { sampleBirths } from './samples';

const strings = (x: unknown): string[] => (typeof x === 'string' ? [x] : x && typeof x === 'object' ? Object.values(x).flatMap(strings) : []);

describe('relationship library', () => {
  it('passes the content lint', () => {
    for (const s of strings([R.DYNAMIC_TEXT, R.SYN_PAIR, R.KOOTA_TEXT, R.REL_TEXT])) expect(lint(s), s).toEqual([]);
  });
});

describe('relationship engine', () => {
  const now = new Date('2026-10-09T12:00:00Z');
  const births = sampleBirths();
  it('reads every sample pair with no gaps and within the lint', () => {
    for (let i = 0; i < births.length; i += 3) {
      const a = births[i];
      const b = births[(i + 5) % births.length];
      const secs = R.relationshipReading(computeNatal(a, now), a, computeNatal(b, now), b, 'Sam', now);
      expect(secs[0].id).toBe('r-dynamics');
      expect(secs[0].items.length).toBeGreaterThan(0);
      const text = secs.flatMap((s) => [s.title, s.intro ?? '', ...s.items.flatMap((x) => [x.heading, x.text, x.basis ?? '']), ...(s.tables ?? []).flatMap((t) => t.rows.flat())]);
      for (const t of text) {
        expect(t, t).not.toMatch(/undefined|NaN|\bnull\b/);
        expect(lint(t), t).toEqual([]);
      }
    }
  });
  it('builds a composite with cusps in order and a Davison chart at the midpoint', () => {
    const a = births[0];
    const b = births[7];
    const ca = computeNatal(a, now);
    const cb = computeNatal(b, now);
    const comp = composite(ca, a, cb, b);
    expect(comp.cusps).toHaveLength(12);
    for (let i = 0; i < 6; i++) expect(Math.abs(((comp.cusps![i + 6] - comp.cusps![i] + 540) % 360) - 180)).toBeCloseTo(180, 5);
    const dv = davison(ca, a, cb, b);
    expect(dv.when.getTime()).toBe((ca.utc.getTime() + cb.utc.getTime()) / 2);
    expect(relationshipTimeline(comp.points, now).every((t) => t.passes.length >= 1)).toBe(true);
  });
  it('reads the ashtakoota factors by the classical tables', () => {
    const side = (sign: string, nakshatra: string, index: number, gana: string, yoni: string): VedicSide => ({ rashi: '', sign, nakshatra, index, gana, yoni });
    // Ashwini (horse, Deva, Adi) and Shatabhisha (horse, Rakshasa, Adi): same yoni, same nadi.
    const k = kootas(side('Aries', 'Ashwini', 0, 'Deva', 'horse'), side('Aquarius', 'Shatabhisha', 23, 'Rakshasa', 'horse'));
    const by = Object.fromEntries(k.map((x) => [x.koota, x.tone]));
    expect(by.Yoni).toBe('harmony');
    expect(by.Nadi).toBe('care');
    expect(by.Gana).toBe('care');
    expect(by['Graha Maitri']).toBe('care'); // Mars and Saturn: Saturn counts Mars an enemy
    expect(by.Bhakoot).toBe('harmony'); // 11th and 3rd from each other
    // Rohini (serpent) and Uttara Ashadha (mongoose): enemy yonis.
    const k2 = kootas(side('Taurus', 'Rohini', 3, 'Manushya', 'serpent'), side('Capricorn', 'Uttara Ashadha', 20, 'Manushya', 'mongoose'));
    expect(k2.find((x) => x.koota === 'Yoni')!.tone).toBe('care');
    expect(k2.find((x) => x.koota === 'Bhakoot')!.tone).toBe('care'); // 9 and 5
  });
});
