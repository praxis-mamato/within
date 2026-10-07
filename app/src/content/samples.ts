/**
 * Sample readings for the review console: real charts run through the real composers, so each
 * fragment can be read in context before it is approved (next-features A1).
 */
import { computeNatal, type BirthInput, type NatalChart } from '../astro/natal';
import { composeReflection } from './compose';
import { vedicReading, westernReading, type ReadingSection } from './fullReading';
import { timingReading, togetherReading, vedicDeep, westernDeep } from './deepReading';
import { OUTCOME_STEPS, planFor, SITUATIONS } from './topics';
import type { Element } from './templates';
import type { Fragment } from './registry';

export interface Passage {
  source: string;
  text: string;
}

const PLACES: Pick<BirthInput, 'lat' | 'lon' | 'tz'>[] = [
  { lat: 18.52, lon: 73.855, tz: 'Asia/Kolkata' },
  { lat: 34.052, lon: -118.244, tz: 'America/Los_Angeles' },
  { lat: -33.87, lon: 151.21, tz: 'Australia/Sydney' },
  { lat: 51.5, lon: -0.13, tz: 'Europe/London' },
  { lat: 40.71, lon: -74.01, tz: 'America/New_York' },
  { lat: -23.55, lon: -46.63, tz: 'America/Sao_Paulo' },
  { lat: 35.68, lon: 139.69, tz: 'Asia/Tokyo' },
  { lat: 6.52, lon: 3.38, tz: 'Africa/Lagos' },
];

/** 36 births spread over decades, months, and hours, plus one with no birth time. */
export function sampleBirths(): BirthInput[] {
  const out: BirthInput[] = [];
  for (let i = 0; i < 36; i++) {
    const y = 1958 + ((i * 7) % 47);
    const m = 1 + ((i * 5) % 12);
    const d = 1 + ((i * 11) % 28);
    const h = (i * 7 + 3) % 24;
    out.push({
      date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      time: `${String(h).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}`,
      timePrecision: 'exact',
      windowMinutes: 60,
      ...PLACES[i % PLACES.length],
    });
  }
  out.push({ date: '2000-01-07', time: '', timePrecision: 'unknown', windowMinutes: 60, ...PLACES[3] });
  return out;
}

const sectionPassages = (label: string, sections: ReadingSection[]): Passage[] =>
  sections.flatMap((s) => [
    ...(s.intro ? [{ source: `${label} · ${s.title}`, text: s.intro }] : []),
    ...s.items.map((it) => ({ source: `${label} · ${s.title}`, text: `${it.heading}. ${it.text}` })),
  ]);

/** Every passage the sample charts produce, labeled with where it would appear. */
export function buildCorpus(now = new Date('2026-10-06T12:00:00Z')): Passage[] {
  const births = sampleBirths();
  const charts: NatalChart[] = births.map((b) => computeNatal(b, now));
  const out: Passage[] = [];
  charts.forEach((c, i) => {
    const who = `Sample ${i + 1} (${births[i].date}${births[i].time ? ` ${births[i].time}` : ', no time'})`;
    for (const pillar of ['self', 'purpose', 'relationship', 'other'] as const) {
      const r = composeReflection(pillar, c, pillar === 'other' ? charts[(i + 1) % charts.length] : null, 'Alex', now);
      const label = `${who} · ${pillar[0].toUpperCase()}${pillar.slice(1)} reflection`;
      out.push(
        { source: `${label}, Western`, text: `${r.western.title}. ${r.western.body}` },
        { source: `${label}, Vedic`, text: `${r.vedic.title}. ${r.vedic.body}` },
        { source: `${label}, Together`, text: r.together.body },
        { source: `${label}, question and step`, text: `${r.question} Step: ${r.step}` },
      );
    }
    out.push(...sectionPassages(`${who} · Western reading`, westernReading(c, now)));
    out.push(...sectionPassages(`${who} · Vedic reading`, vedicReading(c, births[i].date, now)));
    const place = { lat: births[i].lat, lon: births[i].lon };
    const j = (i + 1) % charts.length;
    out.push(...sectionPassages(`${who} · Western deep reading`, westernDeep(c, place)));
    out.push(...sectionPassages(`${who} · Vedic deep reading`, vedicDeep(c)));
    out.push(...sectionPassages(`${who} · Timing`, timingReading(c, place, now)));
    out.push(...sectionPassages(`${who} · Together`, togetherReading(c, place, charts[j], { lat: births[j].lat, lon: births[j].lon }, 'Alex')));
  });
  const elements: Element[] = ['fire', 'earth', 'air', 'water'];
  const outcomes = Object.keys(OUTCOME_STEPS);
  SITUATIONS.forEach((s, i) => {
    const p = planFor(s, [], outcomes[i % outcomes.length], elements[i % 4]);
    out.push({
      source: `Situation “${s}” · reflection question and steps`,
      text: [p.question, `Ideas: ${p.answers.join(' / ')}`, ...p.steps.map((x) => `Step: ${x.text}`), p.style ? `Try ${p.style}.` : ''].join(' '),
    });
  });
  return out;
}

/** Up to `n` sample passages that contain the fragment, from different places where possible. */
export function samplesFor(f: Fragment, corpus: Passage[], n = 3): Passage[] {
  const needle = f.text.replaceAll('{name}', 'Alex').toLowerCase();
  const hits = corpus.filter((p) => p.text.toLowerCase().includes(needle));
  const picked: Passage[] = [];
  const seen = new Set<string>();
  for (const h of hits) {
    const kind = h.source.split(' · ').slice(1).join(' · ');
    if (seen.has(kind)) continue;
    seen.add(kind);
    picked.push(h);
    if (picked.length === n) return picked;
  }
  for (const h of hits) if (!picked.includes(h) && picked.length < n) picked.push(h);
  return picked;
}
