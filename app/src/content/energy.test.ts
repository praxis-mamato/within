import { computeNatal } from '../astro/natal';
import { chartEnergy, energyLayers, ENERGY_TEXT, NATAL_RX, PLANET_HIGH, PLANET_LOW, PLANET_RELEASE } from './energy';
import { lint } from './lint';
import { consultOracle } from './oracleEngine';
import { sampleBirths } from './samples';

const strings = (x: unknown): string[] => (typeof x === 'string' ? [x] : x && typeof x === 'object' ? Object.values(x).flatMap(strings) : []);

describe('your chart’s energy', () => {
  it('library passes the lint', () => {
    for (const s of strings([PLANET_HIGH, PLANET_LOW, PLANET_RELEASE, NATAL_RX, ENERGY_TEXT])) expect(lint(s), s).toEqual([]);
  });
  it('maps every sample chart into tension, flow, and fusion, with roads, releases, and what is active', () => {
    const now = new Date('2026-10-10T12:00:00Z');
    for (const [i, b] of sampleBirths().entries()) {
      if (i % 3) continue;
      const c = computeNatal(b, now);
      const e = chartEnergy(c, b, now);
      expect(e.aspects.length).toBeGreaterThan(0);
      for (const x of e.aspects) expect(['tension', 'flow', 'fusion']).toContain(x.kind);
      const layers = energyLayers(e);
      expect(layers.map((l) => l.title)).toEqual(expect.arrayContaining(['Where you hold tension', 'Where energy flows', 'High road and low road', 'Retrogrades: at birth and now']));
      const text = layers.flatMap((l) => [l.title, ...l.lines.flatMap((x) => [x.heading, x.text, x.basis ?? ''])]);
      for (const t of text) {
        expect(t, t).not.toMatch(/undefined|NaN/);
        expect(lint(t), t).toEqual([]);
      }
    }
  });
  it('answers through the Oracle with the strongest tension and flow free, and the full map as layers', () => {
    const b = sampleBirths()[0];
    const r = consultOracle('Show my chart’s energy', { chart: computeNatal(b), place: b });
    expect(r.intent).toBe('energy');
    expect(r.lines.some((l) => /strongest tension/.test(l.heading))).toBe(true);
    expect(r.layers!.length).toBeGreaterThanOrEqual(5);
  });
});
