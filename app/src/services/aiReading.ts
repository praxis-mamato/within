/**
 * Client side of AI deep readings (docs/readings-engine.md, Route B).
 * The fact sheet (content/factSheet.ts) holds placements only, never the person's name, birth date,
 * time, place, journal, or relationship notes.
 */
import type { DeepResult, Kind } from '../../../supabase/functions/_shared/deepReading';
import { LIVE } from './config';
import { supabase } from './supabase';

export { factSheet, sourceLines } from '../content/factSheet';
export type { DeepResult, Kind };

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
