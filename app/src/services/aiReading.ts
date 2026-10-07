/**
 * Client side of AI deep readings (docs/readings-engine.md, Route B).
 * Builds the fact sheet from the calculated chart: placements only, never the person's name,
 * birth date, time, place, journal, or relationship notes.
 */
import { fmtDeg, type NatalChart } from '../astro/natal';
import { allAspects, aspectPatterns, dashaCalendar, lordshipYogas, monthAhead, synastry, vargas } from '../astro/deep';
import { vedicYogas } from '../content/fullReading';
import type { ReadingSection } from '../content/fullReading';
import { placidusCusps } from '../astro/chart';
import type { DeepResult, Kind } from '../../../supabase/functions/_shared/deepReading';
import { LIMITS } from '../../../supabase/functions/_shared/deepReading';
import { LIVE } from './config';
import { supabase } from './supabase';

export type { DeepResult, Kind };
interface Place {
  lat: number;
  lon: number;
}

function westernFacts(c: NatalChart): string[] {
  const f = c.western.planets.map((p) => `${p.body === 'Node' ? 'North Node' : p.body} in ${p.sign} ${fmtDeg(p.degree)}${p.house ? `, house ${p.house}` : ''}${p.retrograde ? ', retrograde' : ''} (Western, tropical)`);
  if (c.western.ascendant.certain) f.push(`Rising sign ${c.western.ascendant.value} (Western)`);
  else f.push(c.western.ascendant.options.length ? `Rising sign uncertain: ${c.western.ascendant.options.join(' or ')} (Western)` : 'Rising sign and houses unknown: no birth time (Western)');
  if (!c.western.moonSign.certain) f.push(`Moon sign uncertain: ${c.western.moonSign.options.join(' or ')} (Western)`);
  for (const a of allAspects(c).slice(0, 14)) f.push(`${a.a} ${a.aspect} ${a.b}, orb ${fmtDeg(a.orb)} (Western)`);
  for (const p of aspectPatterns(c)) f.push(`${p.name}: ${p.bodies.join(', ')} (${p.where}) (Western)`);
  return f;
}

function vedicFacts(c: NatalChart): string[] {
  const f = c.vedic.planets.map((p) => `${p.body} in ${p.rashi} (${p.sign}) ${fmtDeg(p.degree)}${p.house ? `, house ${p.house}` : ''} (Vedic, sidereal Lahiri)`);
  f.push(c.vedic.lagna.certain ? `Lagna ${c.vedic.lagna.value} (Vedic)` : 'Lagna unknown or uncertain; houses counted from the Moon (Vedic)');
  f.push(c.vedic.moonNakshatra.certain ? `Moon nakshatra ${c.vedic.nakshatra.name} pada ${c.vedic.nakshatra.pada}, lord ${c.vedic.nakshatra.lord} (Vedic)` : `Moon nakshatra uncertain: ${c.vedic.moonNakshatra.options.join(' or ')} (Vedic)`);
  for (const y of vedicYogas(c)) f.push(`${y} yoga present (Vedic)`);
  for (const y of lordshipYogas(c)) f.push(`${y.name} yoga: ${y.grahas.join(' and ')}, lords of houses ${y.houses.join(' and ')} (Vedic)`);
  const v = vargas(c);
  for (const g of v.grahas) f.push(`${g.body} navamsa (D9) in ${g.d9}${g.vargottama ? ', vargottama' : ''} (Vedic)`);
  if (v.d9Lagna) f.push(`Navamsa lagna ${v.d9Lagna} (Vedic)`);
  if (c.vedic.current) f.push(`Current dasha: ${c.vedic.current.maha.lord} mahadasha, ${c.vedic.current.antar.lord} antardasha until ${c.vedic.current.antar.end.toISOString().slice(0, 10)} (Vedic)`);
  return f;
}

export function factSheet(kind: Kind, me: NatalChart, place: Place, other?: { chart: NatalChart; place: Place } | null): string[] {
  let f: string[];
  if (kind === 'western') f = westernFacts(me);
  else if (kind === 'vedic') f = vedicFacts(me);
  else if (kind === 'timing') {
    const m = monthAhead(me, new Date(), 30, place.lat, place.lon);
    f = [
      ...me.western.planets.filter((p) => ['Sun', 'Moon', 'Venus', 'Mars'].includes(p.body)).map((p) => `Natal ${p.body} in ${p.sign} (Western)`),
      ...m.transits.slice(0, 20).map((t) => `${t.date}: transiting ${t.transiting} ${t.aspect} natal ${t.natal}, within ${fmtDeg(t.orb)} (Western)`),
      ...m.lunar.map((l) => `${l.date}: ${l.kind} in ${l.sign}${l.house ? `, natal house ${l.house}` : ''}${l.eclipse ? ', eclipse season' : ''} (Western)`),
      ...m.stations.map((s) => `${s.date}: ${s.body} turns ${s.turns} in ${s.sign} (Western)`),
      ...dashaCalendar(me, new Date(), 12).slice(0, 12).map((d) => `${d.start} to ${d.end}: ${d.lord} ${d.level} within ${d.within} (Vedic)`),
    ];
  } else if (kind === 'together' && other) {
    const s = synastry(me, other.chart, placidusCusps(other.chart.utc, other.place.lat, other.place.lon), placidusCusps(me.utc, place.lat, place.lon));
    f = [
      ...me.western.planets.filter((p) => p.body !== 'Node').map((p) => `Reader's ${p.body} in ${p.sign} (Western)`),
      ...other.chart.western.planets.filter((p) => p.body !== 'Node').map((p) => `Their ${p.body} in ${p.sign} (Western)`),
      ...s.aspects.slice(0, 16).map((a) => `Reader's ${a.a} ${a.aspect} their ${a.b}, orb ${fmtDeg(a.orb)} (Western)`),
      ...s.composite.slice(0, 7).map((p) => `Composite ${p.body} in ${p.sign} (Western)`),
      `Reader's Moon in ${me.vedic.moonRashi.value ?? 'uncertain'}; their Moon in ${other.chart.vedic.moonRashi.value ?? 'uncertain'} (Vedic)`,
    ];
  } else f = [...westernFacts(me), ...vedicFacts(me)];
  return f.slice(0, LIMITS.facts).map((x) => x.slice(0, LIMITS.factChars));
}

/** The approved-library reading for the same tab, flattened, as source material. */
export function sourceLines(sections: ReadingSection[]): string[] {
  return sections
    .flatMap((s) => s.items.map((i) => `${i.heading}: ${i.text}`))
    .slice(0, LIMITS.source)
    .map((x) => x.slice(0, LIMITS.sourceChars));
}

export async function requestDeepReading(kind: Kind, facts: string[], source: string[], question?: string): Promise<DeepResult> {
  if (!LIVE) {
    // Demo mode: no AI call. Show the shape of the result using the approved text.
    await new Promise((r) => setTimeout(r, 600));
    return {
      sections: [
        { title: 'Demo mode', body: 'In live mode this panel shows a connected reading written by Claude Sonnet 5.5 from the placements above and Within’s approved interpretations, checked against Within’s content rules before you see it.', tradition: 'both' },
        ...source.slice(0, 3).map((s) => ({ title: s.split(':')[0], body: s.split(':').slice(1).join(':').trim(), tradition: (kind === 'vedic' ? 'vedic' : 'western') as 'western' | 'vedic' })),
      ],
      reflection_question: question ? `You asked: “${question}”. What would help you notice this in your week?` : 'Which part of this feels most true for you right now?',
    };
  }
  const { data, error } = await supabase()!.functions.invoke('deep-reading', { body: { kind, facts, source, question } });
  if (error) {
    // The function's own message (limit reached, not subscribed) is in the response body.
    const body = await (error as { context?: Response }).context?.json?.().catch(() => null);
    throw new Error(body?.error ?? 'The reading couldn’t be written right now. Try again later.');
  }
  return data as DeepResult;
}
