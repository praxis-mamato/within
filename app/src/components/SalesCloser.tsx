/**
 * The in-app closer: honest selling at the moments that matter, in the Oracle's voice.
 * - LockedSummary: what this person's own locked reading holds (counts only, computed on the device).
 * - WorthIt: plain answers to the six real objections, inside every paywall.
 * - LiveReadingNudge: on big life questions, the option to sit with an astrologer (once a day).
 * No fake urgency, no countdowns, no invented numbers.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { SkyLine } from '../content/today';
import { CONFIG, IN_PLAY_APP } from '../services/config';

const MONTH_DAY = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.? \d{1,2}\b/;

/** How many dated findings a set of lines holds: the days that matter for this person. */
export function datesIn(lines: SkyLine[]): number {
  return lines.filter((l) => MONTH_DAY.test(`${l.heading} ${l.text}`)).length;
}

export const CLOSER_TEXT = {
  worth: 'Is it worth it?',
  qa: [
    ['What do I get that I don’t have now?', 'Unlimited questions, and behind every answer the full reading: your year ahead, progressions, solar return, Vedic periods, your best and hardest days, and what to do, all from your own chart.'],
    ['Is astrology accurate?', 'The planet positions are: Within matches Swiss Ephemeris, the professional standard, on 99.97% of checks. The meanings come from centuries of Western and Vedic tradition and are for reflection, not prediction.'],
    ['Why not a free app or a chatbot?', 'Within reads your exact chart, to the minute and the place you were born, in two traditions at once, and answers with your own dates. Sun-sign horoscopes and general chat answers aren’t built from your exact chart.'],
    ['What about my privacy?', 'Your birth details, chart, questions and journal stay on your phone. We don’t receive them, and nothing is used to train any model.'],
    ['Can I cancel?', 'Yes, online in Account in two taps. You keep access until the end of the period you paid for.'],
    ['It feels like a lot.', `The yearly plan is ${CONFIG.plans.yearly.short}, ${CONFIG.plans.yearly.note}. Or try it monthly at ${CONFIG.plans.monthly.short} and cancel when you like.`],
  ] as [string, string][],
  help: 'A billing or account problem? Write to privacy@praxisglobal.ai and a person replies.',
  liveHeading: 'A question this size deserves a person',
  liveBody: 'Sit with an astrologer, face to face on video, and go through it together.',
  liveCta: 'Seeking a live reading…',
};

export function LockedSummary({ layers }: { layers: { title: string; lines: SkyLine[] }[] }) {
  const findings = layers.reduce((n, l) => n + l.lines.length, 0);
  const dates = layers.reduce((n, l) => n + datesIn(l.lines), 0);
  return (
    <p className="closer-summary">
      You’ve seen the answer. Behind it, your chart holds <strong>{layers.length} more layers</strong> and <strong>{findings} findings</strong>
      {dates > 0 ? (
        <>
          , including <strong>{dates} dates</strong> that matter for you
        </>
      ) : null}
      .
    </p>
  );
}

export function WorthIt() {
  return (
    <details className="closer-worth">
      <summary>{CLOSER_TEXT.worth}</summary>
      <dl>
        {CLOSER_TEXT.qa.map(([q, a]) => (
          <div key={q}>
            <dt>{q}</dt>
            <dd>{a}</dd>
          </div>
        ))}
      </dl>
      <p className="small muted">{CLOSER_TEXT.help}</p>
    </details>
  );
}

const BIG = new Set(['decision', 'together', 'return', 'cycle']);
const KEY = 'within.liveNudge';
function shownToday(): boolean {
  try {
    return localStorage.getItem(KEY) === new Date().toISOString().slice(0, 10);
  } catch {
    return false;
  }
}

/** On big life questions, once a day: the option of a live reading. Not in the Android app (nothing is sold there). */
export function LiveReadingNudge({ intent }: { intent: string }) {
  const [show] = useState(() => BIG.has(intent) && !IN_PLAY_APP && !shownToday());
  useEffect(() => {
    if (!show) return;
    try {
      localStorage.setItem(KEY, new Date().toISOString().slice(0, 10));
    } catch {
      // shown again next time; harmless
    }
  }, [show]);
  if (!show) return null;
  return (
    <Link to="/astrologer" className="live-cta closer-live">
      <span>
        <span className="oracle-card-kicker">{CLOSER_TEXT.liveHeading}</span>
        <span className="small">{CLOSER_TEXT.liveBody}</span>
        <strong>{CLOSER_TEXT.liveCta}</strong>
      </span>
      <span aria-hidden="true">›</span>
    </Link>
  );
}
