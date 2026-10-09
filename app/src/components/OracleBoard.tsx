import { useEffect, useRef, useState, type Ref } from 'react';
import type { Tone } from '../content/oracle';
import type { OracleReply } from '../content/oracleEngine';

// ─── The talking board ────────────────────────────────────────────────────────

const W = 400;
const H = 280;
const UPPER = 'ABCDEFGHIJKLM'.split('');
const LOWER = 'NOPQRSTUVWXYZ'.split('');
const DIGITS = '1234567890'.split('');

/** Letters sit on two shallow arcs, as on a classic talking board. */
function arc(i: number, n: number, cy: number) {
  const r = 455;
  const t0 = (110.6 * Math.PI) / 180;
  const t1 = (69.4 * Math.PI) / 180;
  const t = t0 + ((t1 - t0) * i) / (n - 1);
  const x = W / 2 + r * Math.cos(t);
  const y = cy - r * Math.sin(t);
  return { x, y, rot: 90 - (t * 180) / Math.PI };
}
const SPOTS: Record<string, { x: number; y: number }> = {
  ...Object.fromEntries(UPPER.map((ch, i) => [ch, arc(i, UPPER.length, 560)])),
  ...Object.fromEntries(LOWER.map((ch, i) => [ch, arc(i, LOWER.length, 622)])),
  ...Object.fromEntries(DIGITS.map((d, i) => [d, { x: 82 + i * 26.2, y: 222 }])),
  YES: { x: 92, y: 54 },
  NO: { x: 310, y: 54 },
  'GOOD BYE': { x: 200, y: 256 },
};
const REST = { x: 352, y: 238 };
const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const TONE_WORD: Record<Tone, string> = { go: 'YES', wait: 'WAIT', closer: 'LOOK', again: 'ASK' };
const MONTHS = /\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\b/;

/** What the planchette spells for an answer: YES for go gently, a short word, or a date. */
export function spellFor(r: OracleReply): string[] {
  if (r.tone) return r.tone === 'go' ? ['YES'] : TONE_WORD[r.tone].split('');
  const date = r.orb.toUpperCase().match(new RegExp(`${MONTHS.source}\\s+(\\d{1,2})`));
  if (date) return [...date[1], ...date[2]];
  const word = (r.points || 'MOON').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8);
  return word ? word.split('') : ['YES'];
}

/**
 * A classic talking board, in Within's own design: the alphabet on two arcs, YES and NO under the
 * sun and moon, the numbers, and GOOD BYE. The planchette glides to each letter of the answer.
 * Drag it yourself and the letter under its window lights up.
 */
export function TalkingBoard({ spell, onSpelled, boardRef }: { spell: string[] | null; onSpelled?: () => void; boardRef?: Ref<HTMLDivElement> }) {
  const [pos, setPos] = useState(REST);
  const [lit, setLit] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const wrap = useRef<HTMLDivElement | null>(null);
  const done = useRef(onSpelled);
  done.current = onSpelled;

  useEffect(() => {
    if (!spell) {
      setLit(null);
      return;
    }
    if (reduced()) {
      const last = SPOTS[spell[spell.length - 1]] ?? REST;
      setPos(last);
      setLit(spell[spell.length - 1]);
      done.current?.();
      return;
    }
    const timers: number[] = [];
    // A slow circle to gather, then each letter in turn.
    const warm = [{ x: 200, y: 150 }, { x: 150, y: 130 }, { x: 250, y: 130 }, { x: 200, y: 150 }];
    warm.forEach((p, i) => timers.push(window.setTimeout(() => setPos(p), i * 330)));
    spell.forEach((ch, i) =>
      timers.push(
        window.setTimeout(() => {
          setPos(SPOTS[ch] ?? REST);
          setLit(ch);
        }, warm.length * 330 + i * 700),
      ),
    );
    timers.push(window.setTimeout(() => done.current?.(), warm.length * 330 + spell.length * 700 + 300));
    return () => timers.forEach(clearTimeout);
  }, [spell]);

  const toBoard = (e: React.PointerEvent) => {
    const r = wrap.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };
  const under = (p: { x: number; y: number }) => {
    let best: string | null = null;
    let d = 16 * 16;
    for (const [k, s] of Object.entries(SPOTS)) {
      const dd = (s.x - p.x) ** 2 + (s.y - p.y) ** 2;
      if (dd < d) (d = dd), (best = k);
    }
    return best;
  };
  const glyph = (k: string, size: number, rot = 0) => {
    const s = SPOTS[k];
    const on = lit === k;
    return (
      <text key={k} x={s.x} y={s.y} textAnchor="middle" dominantBaseline="central" fontSize={size} transform={rot ? `rotate(${rot} ${s.x} ${s.y})` : undefined} className={on ? 'tb-lit' : undefined} fill={on ? '#fff3c4' : '#2a170a'}>
        {k}
      </text>
    );
  };

  return (
    <div
      className={`talking-board${dragging ? ' dragging' : ''}`}
      ref={(el) => {
        wrap.current = el;
        if (typeof boardRef === 'function') boardRef(el);
        else if (boardRef) (boardRef as { current: HTMLDivElement | null }).current = el;
      }}
      onPointerMove={(e) => {
        if (!dragging) return;
        const p = toBoard(e);
        setPos(p);
        setLit(under(p));
      }}
      onPointerUp={() => setDragging(false)}
    >
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={lit ? `A talking board. The planchette rests on ${lit}.` : 'A talking board with the alphabet, yes and no, the numbers, and good bye.'}>
        <defs>
          <radialGradient id="tb-wood" cx="50%" cy="45%" r="75%">
            <stop offset="0" stopColor="#e7cf9f" />
            <stop offset="0.6" stopColor="#cfa76a" />
            <stop offset="1" stopColor="#8f6131" />
          </radialGradient>
          <pattern id="tb-grain" width="400" height="14" patternUnits="userSpaceOnUse">
            <path d="M0 7 C 80 3, 160 11, 240 6 S 360 9, 400 6" stroke="#7a4f22" strokeOpacity="0.12" fill="none" />
          </pattern>
        </defs>
        <rect x="2" y="2" width={W - 4} height={H - 4} rx="20" fill="url(#tb-wood)" stroke="#3b2412" strokeWidth="3" />
        <rect x="2" y="2" width={W - 4} height={H - 4} rx="20" fill="url(#tb-grain)" />
        <rect x="11" y="11" width={W - 22} height={H - 22} rx="14" fill="none" stroke="#3b2412" strokeWidth="1.2" />
        <rect x="15" y="15" width={W - 30} height={H - 30} rx="12" fill="none" stroke="#3b2412" strokeWidth="0.6" strokeDasharray="1 3" />
        {/* Sun over YES, moon over NO */}
        <g stroke="#2a170a" strokeWidth="1.4" fill="none">
          <circle cx="48" cy="50" r="12" fill="#e9c879" />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i * Math.PI) / 6;
            return <line key={i} x1={48 + 15 * Math.cos(a)} y1={50 + 15 * Math.sin(a)} x2={48 + 21 * Math.cos(a)} y2={50 + 21 * Math.sin(a)} />;
          })}
          <path d="M 352 36 a 15 15 0 1 0 0 28 a 11 11 0 1 1 0 -28 Z" fill="#e9c879" />
        </g>
        <text x="200" y="44" textAnchor="middle" fontSize="15" letterSpacing="6" fill="#2a170a" className="tb-title">
          ✦ WITHIN ✦
        </text>
        {glyph('YES', 22)}
        {glyph('NO', 22)}
        {UPPER.map((ch) => glyph(ch, 27, SPOTS_ROT[ch]))}
        {LOWER.map((ch) => glyph(ch, 27, SPOTS_ROT[ch]))}
        {DIGITS.map((d) => glyph(d, 20))}
        {glyph('GOOD BYE', 17)}
      </svg>
      {/* The planchette: a wooden heart with a brass-rimmed glass window */}
      <svg
        className="tb-planchette"
        viewBox="0 0 80 96"
        aria-hidden="true"
        style={{ left: `${(pos.x / W) * 100}%`, top: `${(pos.y / H) * 100}%` }}
        onPointerDown={(e) => {
          wrap.current?.setPointerCapture?.(e.pointerId);
          setDragging(true);
        }}
      >
        <defs>
          <linearGradient id="tb-pl" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f6ead2" />
            <stop offset="1" stopColor="#c9a36a" />
          </linearGradient>
        </defs>
        <path d="M40 4 C 52 20 78 40 76 62 C 74 80 58 90 40 82 C 22 90 6 80 4 62 C 2 40 28 20 40 4 Z" fill="url(#tb-pl)" stroke="#3b2412" strokeWidth="2.5" />
        <circle cx="40" cy="34" r="13" fill="#fffaf0" fillOpacity="0.18" stroke="#9a7330" strokeWidth="3.5" />
        <circle cx="40" cy="34" r="13" fill="none" stroke="#3b2412" strokeWidth="0.8" />
        <path d="M33 29 a 8 8 0 0 1 7 -4" stroke="#fff" strokeOpacity="0.8" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="16" cy="66" r="2.2" fill="#3b2412" />
        <circle cx="64" cy="66" r="2.2" fill="#3b2412" />
        <circle cx="40" cy="78" r="2.2" fill="#3b2412" />
      </svg>
    </div>
  );
}
const SPOTS_ROT: Record<string, number> = Object.fromEntries([
  ...UPPER.map((ch, i) => [ch, arc(i, UPPER.length, 560).rot]),
  ...LOWER.map((ch, i) => [ch, arc(i, LOWER.length, 622).rot]),
]);

// ─── The fortune ball ─────────────────────────────────────────────────────────

/** Up to four short lines that fit inside the triangle. */
function lines(text: string): string[] {
  const out: string[] = [];
  for (const w of text.toUpperCase().split(' ').filter(Boolean)) {
    const last = out[out.length - 1];
    if (last && (last + ' ' + w).length <= 9) out[out.length - 1] = `${last} ${w}`;
    else out.push(w);
  }
  return out.slice(0, 4);
}

/**
 * A black fortune ball. Tap or shake it: it rattles, the window goes dark, and the blue die floats
 * up through the ink with the answer on its face.
 */
export function FortuneBall({ phase, text, onAsk }: { phase: 'idle' | 'seeking' | 'answered'; text: string; onAsk?: () => void }) {
  const ls = lines(phase === 'answered' ? text : phase === 'idle' ? 'ASK' : '');
  const size = ls.some((l) => l.length > 7) ? 11 : 13;
  return (
    <button type="button" className={`fortune-ball ${phase}`} onClick={onAsk} aria-label={phase === 'answered' ? `The ball reads: ${text}` : 'Shake or tap the ball to ask'}>
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <defs>
          <radialGradient id="fb-body" cx="38%" cy="30%" r="75%">
            <stop offset="0" stopColor="#5a5a62" />
            <stop offset="0.25" stopColor="#1d1d22" />
            <stop offset="1" stopColor="#020203" />
          </radialGradient>
          <radialGradient id="fb-ink" cx="50%" cy="45%" r="60%">
            <stop offset="0" stopColor="#13235f" />
            <stop offset="1" stopColor="#040817" />
          </radialGradient>
          <linearGradient id="fb-die" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3956d6" />
            <stop offset="1" stopColor="#1b2d93" />
          </linearGradient>
          <clipPath id="fb-win">
            <circle cx="100" cy="100" r="50" />
          </clipPath>
        </defs>
        <ellipse cx="100" cy="190" rx="62" ry="7" fill="#000" opacity="0.45" />
        <circle cx="100" cy="98" r="90" fill="url(#fb-body)" />
        <circle cx="100" cy="100" r="56" fill="#0a0a0d" />
        <circle cx="100" cy="100" r="52" fill="url(#fb-ink)" stroke="#2c2c33" strokeWidth="2" />
        <g clipPath="url(#fb-win)">
          <g className="fb-die">
            <path d="M 52 72 L 148 72 L 100 150 Z" fill="url(#fb-die)" stroke="#6f86ff" strokeOpacity="0.5" strokeWidth="1.2" strokeLinejoin="round" />
            <text x="100" y={95 - (ls.length - 1) * 7} textAnchor="middle" fill="#eef2ff" fontSize={size} fontWeight={700} letterSpacing="0.6" fontFamily="'Source Sans 3', sans-serif">
              {ls.map((l, i) => (
                <tspan key={`${l}-${i}`} x="100" dy={i ? 14 : 0}>
                  {l}
                </tspan>
              ))}
            </text>
          </g>
          {[0, 1, 2, 3, 4].map((i) => (
            <circle key={i} className="fb-bubble" cx={78 + i * 11} cy={136 - (i % 3) * 6} r={1 + (i % 2)} fill="#9fb2ff" opacity="0.5" style={{ animationDelay: `${i * 0.5}s` }} />
          ))}
        </g>
        <ellipse cx="66" cy="44" rx="30" ry="15" fill="#fff" opacity="0.22" transform="rotate(-30 66 44)" />
        <circle cx="56" cy="40" r="5" fill="#fff" opacity="0.6" />
      </svg>
    </button>
  );
}

/** A small fortune ball for the Today card. */
export function MiniOrb() {
  return (
    <svg viewBox="0 0 80 80" width="72" height="72" aria-hidden="true" className="mini-orb">
      <defs>
        <radialGradient id="mb-body" cx="38%" cy="30%" r="75%">
          <stop offset="0" stopColor="#5a5a62" />
          <stop offset="0.3" stopColor="#1d1d22" />
          <stop offset="1" stopColor="#020203" />
        </radialGradient>
      </defs>
      <circle cx="40" cy="40" r="34" fill="url(#mb-body)" />
      <circle cx="40" cy="41" r="16" fill="#0b1236" stroke="#2c2c33" />
      <path d="M 31 35 L 49 35 L 40 50 Z" fill="#3048c4" />
      <ellipse cx="27" cy="20" rx="11" ry="5" fill="#fff" opacity="0.25" transform="rotate(-30 27 20)" />
    </svg>
  );
}

export function useShake(onShake: () => void) {
  const cb = useRef(onShake);
  cb.current = onShake;
  useEffect(() => {
    let last = 0;
    const handler = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const g = Math.sqrt((a.x ?? 0) ** 2 + (a.y ?? 0) ** 2 + (a.z ?? 0) ** 2);
      if (g > 22 && Date.now() - last > 1500) {
        last = Date.now();
        cb.current();
      }
    };
    window.addEventListener('devicemotion', handler);
    return () => window.removeEventListener('devicemotion', handler);
  }, []);
  return async () => {
    const DM = window.DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> } | undefined;
    if (DM?.requestPermission) await DM.requestPermission().catch(() => 'denied');
  };
}
