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
  const [pos, setPos] = useState({ x: C, y: C + 112 });
  const timers = useRef<number[]>([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const target = sky.find((p) => p.body === points);
    const sign = SIGN_NAMES.indexOf(points ?? '');
    const land = target ? at(target.lon, target.r) : sign >= 0 ? at(sign * 30 + 15, 158) : { x: C, y: C + 112 };
    if (phase === 'seeking' && !reduced()) {
      const hops = [0, 1, 2, 3].map(() => at(Math.random() * 360, 100 + Math.random() * 40));
      hops.forEach((h, i) => timers.current.push(window.setTimeout(() => setPos(h), i * 480)));
      timers.current.push(window.setTimeout(() => setPos(land), hops.length * 480));
    } else if (phase !== 'idle') setPos(land);
    else setPos({ x: C, y: C + 112 });
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
            <stop offset="0" stopColor="#1f2a5c" />
            <stop offset="0.6" stopColor="#10173a" />
            <stop offset="1" stopColor="#090c20" />
          </radialGradient>
          <linearGradient id="ob-dawn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.55" stopColor="#e9a46a" stopOpacity="0" />
            <stop offset="1" stopColor="#e9a46a" stopOpacity="0.45" />
          </linearGradient>
          <radialGradient id="ob-glass" cx="36%" cy="30%" r="78%">
            <stop offset="0" stopColor="#4a63b0" />
            <stop offset="0.45" stopColor="#1b2a62" />
            <stop offset="0.85" stopColor="#0b1233" />
            <stop offset="1" stopColor="#060a1e" />
          </radialGradient>
          <radialGradient id="ob-core" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#ffdf9a" stopOpacity="0.55" />
            <stop offset="0.6" stopColor="#e2b765" stopOpacity="0.12" />
            <stop offset="1" stopColor="#e2b765" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ob-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f3d68e" />
            <stop offset="0.5" stopColor="#c99a4a" />
            <stop offset="1" stopColor="#8a6327" />
          </linearGradient>
          <clipPath id="ob-clip">
            <circle cx={C} cy={C} r="60" />
          </clipPath>
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
          <circle cx={SIZE - 28} cy="30" r="11" fill="#141c45" stroke="none" />
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
        {/* The orb: a midnight crystal sphere with gold armillary rings, on a gold stand */}
        <path d={`M ${C - 30} ${C + 74} L ${C + 30} ${C + 74} L ${C + 22} ${C + 58} L ${C - 22} ${C + 58} Z`} fill="url(#ob-gold)" />
        <rect x={C - 38} y={C + 73} width="76" height="6" rx="3" fill="url(#ob-gold)" />
        <g className="ob-orb">
          <circle cx={C} cy={C} r="62" fill="url(#ob-glass)" stroke="url(#ob-gold)" strokeWidth="2.5" />
          <g clipPath="url(#ob-clip)">
            {Array.from({ length: 22 }, (_, i) => (
              <circle key={i} cx={C - 52 + ((i * 37) % 104)} cy={C - 50 + ((i * 53) % 100)} r={i % 5 === 0 ? 1.2 : 0.6} fill="#fdf3d6" opacity={0.4 + (i % 4) * 0.15} />
            ))}
            <circle cx={C} cy={C} r="58" fill="url(#ob-core)" className="ob-core" />
            <g className="ob-rings" fill="none" stroke="#e2c27e" strokeOpacity="0.55">
              <ellipse cx={C} cy={C} rx="60" ry="17" transform={`rotate(-18 ${C} ${C})`} />
              <ellipse cx={C} cy={C} rx="18" ry="60" transform={`rotate(-18 ${C} ${C})`} strokeOpacity="0.3" />
            </g>
          </g>
          <ellipse cx={C - 24} cy={C - 32} rx="16" ry="8" fill="#fff" opacity="0.32" transform={`rotate(-30 ${C - 24} ${C - 32})`} />
          <circle cx={C - 33} cy={C - 37} r="3" fill="#fff" opacity="0.75" />
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
      {/* The pointer: a gold celestial lens with a four-pointed star, centred on what it reads */}
      <svg className="ob-planchette" viewBox="0 0 64 64" aria-hidden="true" style={{ left: `${(pos.x / SIZE) * 100}%`, top: `${(pos.y / SIZE) * 100}%` }}>
        <defs>
          <linearGradient id="ob-lens-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fbe3a0" />
            <stop offset="1" stopColor="#b98a3c" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="15" fill="#fffaf0" fillOpacity="0.12" stroke="url(#ob-lens-gold)" strokeWidth="3" />
        <circle cx="32" cy="32" r="20" fill="none" stroke="#f3d68e" strokeOpacity="0.45" strokeWidth="1" strokeDasharray="2 4" />
        {[0, 90, 180, 270].map((a) => (
          <path key={a} d="M32 2 L35 12 L32 10 L29 12 Z" fill="url(#ob-lens-gold)" transform={`rotate(${a} 32 32)`} />
        ))}
        <path d="M24 26 a 9 9 0 0 1 8 -4" stroke="#fff" strokeOpacity="0.7" strokeWidth="2" fill="none" strokeLinecap="round" />
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
        <radialGradient id="mo-glass" cx="36%" cy="30%" r="78%">
          <stop offset="0" stopColor="#4a63b0" />
          <stop offset="0.5" stopColor="#1b2a62" />
          <stop offset="1" stopColor="#070b20" />
        </radialGradient>
        <linearGradient id="mo-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3d68e" />
          <stop offset="1" stopColor="#a87b34" />
        </linearGradient>
      </defs>
      <path d="M27 72 L53 72 L49 64 L31 64 Z" fill="url(#mo-gold)" />
      <circle cx="40" cy="36" r="29" fill="url(#mo-glass)" stroke="url(#mo-gold)" strokeWidth="2" />
      <ellipse cx="40" cy="36" rx="28" ry="8" fill="none" stroke="#e2c27e" strokeOpacity="0.55" transform="rotate(-18 40 36)" />
      <path d="M40 24 L42 33 L51 36 L42 39 L40 48 L38 39 L29 36 L38 33 Z" fill="#ffe7a8" />
      <circle cx="28" cy="22" r="2.2" fill="#fff" opacity="0.8" />
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
