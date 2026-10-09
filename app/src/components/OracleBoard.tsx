import { useEffect, useMemo, useRef, useState, type Ref } from 'react';
import { tropicalLongitude } from '../astro/chart';
import type { Tone } from '../content/oracle';

const SIZE = 360;
const C = SIZE / 2;
const SIGN_NAMES = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const ZODIAC = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
const PLANETS = [
  ['Sun', '☉'],
  ['Moon', '☽'],
  ['Mercury', '☿'],
  ['Venus', '♀'],
  ['Mars', '♂'],
  ['Jupiter', '♃'],
  ['Saturn', '♄'],
  ['Uranus', '♅'],
  ['Neptune', '♆'],
  ['Pluto', '♇'],
] as const;
// Tone words sit on the diagonals, like the corners of a talking board.
const TONES: { tone: Tone; word: string; deg: number }[] = [
  { tone: 'go', word: 'GO GENTLY', deg: 135 },
  { tone: 'wait', word: 'WAIT', deg: 45 },
  { tone: 'closer', word: 'LOOK CLOSER', deg: 315 },
  { tone: 'again', word: 'ASK AGAIN', deg: 225 },
];

// Chart-wheel orientation: 0° Aries on the left, signs running counter-clockwise.
const at = (lon: number, r: number) => {
  const a = ((180 - lon) * Math.PI) / 180;
  return { x: C + r * Math.cos(a), y: C - r * Math.sin(a) };
};
const polar = (deg: number, r: number) => ({ x: C + r * Math.cos((deg * Math.PI) / 180), y: C - r * Math.sin((deg * Math.PI) / 180) });
const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Where each planet is in the sky right now, spread apart when two sit close. */
function skyNow(now: Date) {
  const placed: { body: string; glyph: string; lon: number; r: number }[] = [];
  for (const [body, glyph] of PLANETS) {
    const lon = tropicalLongitude(body, now);
    const near = placed.filter((p) => Math.abs(((p.lon - lon + 540) % 360) - 180) < 9).length;
    placed.push({ body, glyph, lon, r: 128 - near * 15 });
  }
  return placed;
}

/**
 * The Oracle's board: the zodiac and today's real planet positions on a night-sky board that warms
 * into dawn at the bottom, a glass orb at the centre, and a planchette that searches the board and
 * comes to rest on the planet behind the answer.
 */
export function OracleBoard({ phase, points, tone, orb, boardRef }: { phase: 'idle' | 'seeking' | 'answered'; points?: string; tone?: Tone; orb?: string; boardRef?: Ref<HTMLDivElement> }) {
  const sky = useMemo(() => skyNow(new Date()), []);
  const [pos, setPos] = useState({ x: C, y: C + 92 });
  const timers = useRef<number[]>([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const target = sky.find((p) => p.body === points);
    const sign = SIGN_NAMES.indexOf(points ?? '');
    const land = target ? at(target.lon, target.r) : sign >= 0 ? at(sign * 30 + 15, 158) : { x: C, y: C + 92 };
    if (phase === 'seeking' && !reduced()) {
      const hops = [0, 1, 2, 3].map(() => at(Math.random() * 360, 100 + Math.random() * 40));
      hops.forEach((h, i) => timers.current.push(window.setTimeout(() => setPos(h), i * 480)));
      timers.current.push(window.setTimeout(() => setPos(land), hops.length * 480));
    } else if (phase !== 'idle') setPos(land);
    else setPos({ x: C, y: C + 92 });
    return () => timers.current.forEach(clearTimeout);
  }, [phase, points, sky]);

  // The orb shows the answer's own words, the tone for a decision, or a welcome before the first question.
  const text = phase === 'answered' ? orb || (tone ? TONES.find((t) => t.tone === tone)!.word : '') : phase === 'idle' ? 'WELCOME' : '';
  const words = wrap(text);
  return (
    <div className={`oracle-board ${phase}`} ref={boardRef}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={phase === 'answered' ? `The planchette rests on ${points}. The orb reads: ${text.toLowerCase()}.` : 'A talking board of the zodiac with today’s planets, and a glass orb at the centre.'}>
        <defs>
          <radialGradient id="ob-sky" cx="50%" cy="38%" r="75%">
            <stop offset="0" stopColor="#3a2049" />
            <stop offset="0.6" stopColor="#1d1027" />
            <stop offset="1" stopColor="#120916" />
          </radialGradient>
          <linearGradient id="ob-dawn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.55" stopColor="#e9a46a" stopOpacity="0" />
            <stop offset="1" stopColor="#e9a46a" stopOpacity="0.45" />
          </linearGradient>
          <radialGradient id="ob-glass" cx="38%" cy="32%" r="70%">
            <stop offset="0" stopColor="#f8efe6" stopOpacity="0.9" />
            <stop offset="0.25" stopColor="#b9a3d6" stopOpacity="0.55" />
            <stop offset="0.7" stopColor="#3b2458" stopOpacity="0.9" />
            <stop offset="1" stopColor="#170c22" />
          </radialGradient>
          <radialGradient id="ob-mist" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#f3d9a8" stopOpacity="0.55" />
            <stop offset="1" stopColor="#f3d9a8" stopOpacity="0" />
          </radialGradient>
          <filter id="ob-blur">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
        <rect x="2" y="2" width={SIZE - 4} height={SIZE - 4} rx="26" fill="url(#ob-sky)" stroke="#c9a15a" strokeWidth="2" />
        <rect x="2" y="2" width={SIZE - 4} height={SIZE - 4} rx="26" fill="url(#ob-dawn)" />
        {/* Stars */}
        {Array.from({ length: 46 }, (_, i) => {
          const x = (i * 97) % SIZE;
          const y = (i * 61 + 23) % SIZE;
          return <circle key={i} cx={x} cy={y} r={i % 7 === 0 ? 1.4 : 0.7} fill="#f7e9c8" opacity={0.35 + (i % 5) * 0.1} className={i % 6 === 0 ? 'ob-twinkle' : undefined} />;
        })}
        {/* Sun and Moon in the top corners, as on old talking boards */}
        <g stroke="#d9b36a" fill="none" strokeWidth="1.4">
          <circle cx="34" cy="34" r="9" />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4;
            return <line key={i} x1={34 + 12 * Math.cos(a)} y1={34 + 12 * Math.sin(a)} x2={34 + 17 * Math.cos(a)} y2={34 + 17 * Math.sin(a)} />;
          })}
          <circle cx={SIZE - 34} cy="34" r="12" fill="#d9b36a" stroke="none" />
          <circle cx={SIZE - 28} cy="30" r="11" fill="#22122c" stroke="none" />
        </g>
        {/* Rings */}
        <circle cx={C} cy={C} r="170" fill="none" stroke="#c9a15a" strokeOpacity="0.7" />
        <circle cx={C} cy={C} r="146" fill="none" stroke="#c9a15a" strokeOpacity="0.45" />
        {ZODIAC.map((_, i) => {
          const a = at(i * 30, 146);
          const b = at(i * 30, 170);
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#c9a15a" strokeOpacity="0.4" />;
        })}
        {ZODIAC.map((g, i) => {
          const p = at(i * 30 + 15, 158);
          const on = phase === 'answered' && points === SIGN_NAMES[i];
          return (
            <text key={g} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize={on ? 19 : 14} fill={on ? '#ffe7a8' : '#e8cf98'} className={on ? 'ob-glow' : undefined}>
              {`${g}\uFE0E`}
            </text>
          );
        })}
        {sky.map((p) => {
          const q = at(p.lon, p.r);
          const on = phase === 'answered' && p.body === points;
          return (
            <text key={p.body} x={q.x} y={q.y} textAnchor="middle" dominantBaseline="central" fontSize={on ? 21 : 16} fill={on ? '#ffe7a8' : '#f2e3cf'} className={on ? 'ob-glow' : undefined}>
              {`${p.glyph}\uFE0E`}
            </text>
          );
        })}
        {TONES.map((t) => {
          const p = polar(t.deg, 90);
          const on = phase === 'answered' && tone === t.tone;
          return (
            <text key={t.tone} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize="9.5" letterSpacing="1.6" fill={on ? '#ffe7a8' : '#c9b2a0'} fontWeight={on ? 700 : 400} className={on ? 'ob-glow' : undefined}>
              {t.word}
            </text>
          );
        })}
        {/* The orb */}
        <ellipse cx={C} cy={C + 66} rx="40" ry="7" fill="#000" opacity="0.35" />
        <g className="ob-orb">
          <circle cx={C} cy={C} r="62" fill="url(#ob-glass)" stroke="#e8cf98" strokeOpacity="0.6" />
          <g className="ob-mist" filter="url(#ob-blur)">
            <ellipse cx={C - 14} cy={C + 6} rx="30" ry="14" fill="url(#ob-mist)" />
            <ellipse cx={C + 16} cy={C - 10} rx="24" ry="11" fill="url(#ob-mist)" />
          </g>
          <path d={`M ${C - 40} ${C - 28} q 14 -26 46 -30`} stroke="#fff" strokeOpacity="0.55" strokeWidth="5" fill="none" strokeLinecap="round" />
          {words.length > 0 && (
            <text key={text} x={C} y={C + 6 - (words.length - 1) * 9} textAnchor="middle" fill="#fff6e3" fontSize={words.some((w) => w.length > 9) ? 12.5 : 15} letterSpacing="1.5" fontWeight={600} className={phase === 'idle' ? 'ob-breathe' : 'ob-reveal'}>
              {words.map((w, i) => (
                <tspan key={`${w}-${i}`} x={C} dy={i ? 18 : 0}>
                  {w}
                </tspan>
              ))}
            </text>
          )}
        </g>
      </svg>
      <svg className="ob-planchette" viewBox="0 0 64 78" aria-hidden="true" style={{ left: `${(pos.x / SIZE) * 100}%`, top: `${(pos.y / SIZE) * 100}%` }}>
        <path d="M32 2 C 50 18 62 34 62 52 C 62 68 48 76 32 76 C 16 76 2 68 2 52 C 2 34 14 18 32 2 Z" fill="#f4e6cf" fillOpacity="0.82" stroke="#8c6a2f" strokeWidth="2" />
        <circle cx="32" cy="30" r="11" fill="#fffaf0" fillOpacity="0.25" stroke="#8c6a2f" strokeWidth="2" />
        <circle cx="28" cy="26" r="3" fill="#fff" fillOpacity="0.8" />
        <path d="M18 58 q 14 8 28 0" stroke="#8c6a2f" strokeWidth="1.5" fill="none" />
      </svg>
    </div>
  );
}

/** Up to three short lines that fit inside the orb. */
function wrap(text: string): string[] {
  const out: string[] = [];
  for (const w of text.split(' ').filter(Boolean)) {
    const last = out[out.length - 1];
    if (last && (last + ' ' + w).length <= 11) out[out.length - 1] = `${last} ${w}`;
    else out.push(w);
  }
  return out.slice(0, 3);
}

/** A small orb for the Today card. */
export function MiniOrb() {
  return (
    <svg viewBox="0 0 80 80" width="72" height="72" aria-hidden="true" className="mini-orb">
      <defs>
        <radialGradient id="mo-glass" cx="38%" cy="32%" r="70%">
          <stop offset="0" stopColor="#f8efe6" stopOpacity="0.95" />
          <stop offset="0.3" stopColor="#b9a3d6" stopOpacity="0.6" />
          <stop offset="0.75" stopColor="#3b2458" />
          <stop offset="1" stopColor="#170c22" />
        </radialGradient>
      </defs>
      <ellipse cx="40" cy="73" rx="20" ry="4" fill="#000" opacity="0.3" />
      <circle cx="40" cy="38" r="31" fill="url(#mo-glass)" stroke="#e8cf98" strokeOpacity="0.7" />
      <path d="M20 26 q 7 -13 23 -15" stroke="#fff" strokeOpacity="0.6" strokeWidth="3" fill="none" strokeLinecap="round" />
      <text x="40" y="44" textAnchor="middle" fontSize="16" fill="#ffe7a8">
        ☽
      </text>
    </svg>
  );
}

/** Calls `onShake` when the phone is shaken. iOS asks permission on the first tap that calls `enable`. */
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
