import { useEffect, useMemo, useRef, useState, type Ref } from 'react';
import { tropicalLongitude } from '../astro/chart';
import type { Tone } from '../content/oracle';
import { CrystalOrb } from './CrystalOrb';

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
const ORB_R = 68;
const REST = { x: C, y: C + 118 };
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

export type BoardPick = { kind: 'planet' | 'sign' | 'tone'; name: string };

/**
 * The Oracle's board: the zodiac and today's real planet positions on a night-sky board that warms
 * into dawn, a living crystal ball on a gold stand, and a pointer that searches the board and comes
 * to rest on what the answer is about. Everything on it can be touched: tap a planet, a sign, or an
 * answer word, or drag the pointer onto one, to learn what it means. Touch and hold the ball to ask.
 */
export function OracleBoard({
  phase,
  points,
  tone,
  orb,
  boardRef,
  onPick,
  onOrb,
  prompt,
}: {
  phase: 'idle' | 'seeking' | 'answered';
  points?: string;
  tone?: Tone;
  orb?: string;
  boardRef?: Ref<HTMLDivElement>;
  onPick?: (p: BoardPick) => void;
  /** Called when the ball is released after a touch or hold. */
  onOrb?: () => void;
  /** Words for the ball before the first answer, e.g. "ASK ME". */
  prompt?: string;
}) {
  const sky = useMemo(() => skyNow(new Date()), []);
  const [pos, setPos] = useState(REST);
  const [picked, setPicked] = useState<BoardPick | null>(null);
  const [holding, setHolding] = useState(false);
  const [dragging, setDragging] = useState(false);
  const timers = useRef<number[]>([]);
  const wrapEl = useRef<HTMLDivElement | null>(null);

  const spots = useMemo(
    () => [
      ...sky.map((p) => ({ kind: 'planet' as const, name: p.body, ...at(p.lon, p.r) })),
      ...SIGN_NAMES.map((name, i) => ({ kind: 'sign' as const, name, ...at(i * 30 + 15, 158) })),
      ...TONES.map((t) => ({ kind: 'tone' as const, name: t.tone, ...polar(t.deg, 98) })),
    ],
    [sky],
  );

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPicked(null);
    const target = spots.find((s) => s.kind !== 'tone' && s.name === points);
    const land = target ?? REST;
    if (phase === 'seeking' && !reduced()) {
      const hops = [0, 1, 2, 3].map(() => at(Math.random() * 360, 100 + Math.random() * 40));
      hops.forEach((h, i) => timers.current.push(window.setTimeout(() => setPos(h), i * 480)));
      timers.current.push(window.setTimeout(() => setPos({ x: land.x, y: land.y }), hops.length * 480));
    } else if (phase !== 'idle') setPos({ x: land.x, y: land.y });
    else setPos(REST);
    return () => timers.current.forEach(clearTimeout);
  }, [phase, points, spots]);

  const pick = (p: BoardPick) => {
    const s = spots.find((x) => x.kind === p.kind && x.name === p.name);
    if (s) setPos({ x: s.x, y: s.y });
    setPicked(p);
    onPick?.(p);
  };
  const toBoard = (e: React.PointerEvent) => {
    const r = wrapEl.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * SIZE, y: ((e.clientY - r.top) / r.height) * SIZE };
  };
  const nearest = (x: number, y: number) => {
    let best: (typeof spots)[number] | null = null;
    let d = 22 * 22;
    for (const s of spots) {
      const dd = (s.x - x) ** 2 + (s.y - y) ** 2;
      if (dd < d) (d = dd), (best = s);
    }
    return best;
  };

  // The ball shows the answer's own words, the tone for a decision, or an invitation before the first question.
  const text = phase === 'answered' ? orb || (tone ? TONES.find((t) => t.tone === tone)!.word : '') : phase === 'idle' ? (holding ? 'ASK' : (prompt ?? 'WELCOME')) : '';
  const words = wrap(text);
  const lit = (kind: BoardPick['kind'], name: string) => (picked ? picked.kind === kind && picked.name === name : phase === 'answered' && (kind === 'tone' ? tone === name : points === name));
  const key = (p: BoardPick) => (e: React.KeyboardEvent) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), pick(p));

  return (
    <div
      className={`oracle-board ${phase}${holding ? ' holding' : ''}${dragging ? ' dragging' : ''}`}
      ref={(el) => {
        wrapEl.current = el;
        if (typeof boardRef === 'function') boardRef(el);
        else if (boardRef) (boardRef as { current: HTMLDivElement | null }).current = el;
      }}
      onPointerMove={(e) => dragging && setPos(toBoard(e))}
      onPointerUp={(e) => {
        if (!dragging) return;
        setDragging(false);
        const s = nearest(toBoard(e).x, toBoard(e).y);
        if (s) pick({ kind: s.kind, name: s.name });
      }}
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="group" aria-label="The Oracle’s board: the zodiac, today’s planets, and a crystal ball. Tap any planet, sign, or answer to learn what it means.">
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
          <linearGradient id="ob-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f6dc98" />
            <stop offset="0.45" stopColor="#d1a352" />
            <stop offset="1" stopColor="#7d5820" />
          </linearGradient>
          <radialGradient id="ob-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0.6" stopColor="#ffd98a" stopOpacity="0.28" />
            <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x="2" y="2" width={SIZE - 4} height={SIZE - 4} rx="26" fill="url(#ob-sky)" stroke="#c9a15a" strokeWidth="2" />
        <rect x="2" y="2" width={SIZE - 4} height={SIZE - 4} rx="26" fill="url(#ob-dawn)" />
        {Array.from({ length: 46 }, (_, i) => (
          <circle key={i} cx={(i * 97) % SIZE} cy={(i * 61 + 23) % SIZE} r={i % 7 === 0 ? 1.4 : 0.7} fill="#f7e9c8" opacity={0.35 + (i % 5) * 0.1} className={i % 6 === 0 ? 'ob-twinkle' : undefined} />
        ))}
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
        <circle cx={C} cy={C} r="170" fill="none" stroke="#c9a15a" strokeOpacity="0.7" />
        <circle cx={C} cy={C} r="146" fill="none" stroke="#c9a15a" strokeOpacity="0.45" />
        {ZODIAC.map((_, i) => {
          const a = at(i * 30, 146);
          const b = at(i * 30, 170);
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#c9a15a" strokeOpacity="0.4" />;
        })}
        {ZODIAC.map((g, i) => {
          const p = at(i * 30 + 15, 158);
          const on = lit('sign', SIGN_NAMES[i]);
          const pk = { kind: 'sign' as const, name: SIGN_NAMES[i] };
          return (
            <g key={g} role="button" tabIndex={0} aria-label={SIGN_NAMES[i]} className="ob-spot" onClick={() => pick(pk)} onKeyDown={key(pk)}>
              <circle cx={p.x} cy={p.y} r="13" fill="transparent" />
              <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize={on ? 19 : 14} fill={on ? '#ffe7a8' : '#e8cf98'} className={on ? 'ob-glow' : undefined}>
                {`${g}︎`}
              </text>
            </g>
          );
        })}
        {sky.map((p) => {
          const q = at(p.lon, p.r);
          const on = lit('planet', p.body);
          const pk = { kind: 'planet' as const, name: p.body };
          return (
            <g key={p.body} role="button" tabIndex={0} aria-label={`${p.body} today`} className="ob-spot" onClick={() => pick(pk)} onKeyDown={key(pk)}>
              <circle cx={q.x} cy={q.y} r="13" fill="transparent" />
              <text x={q.x} y={q.y} textAnchor="middle" dominantBaseline="central" fontSize={on ? 21 : 16} fill={on ? '#ffe7a8' : '#f2e3cf'} className={on ? 'ob-glow' : undefined}>
                {`${p.glyph}︎`}
              </text>
            </g>
          );
        })}
        {TONES.map((t) => {
          const p = polar(t.deg, 98);
          const on = lit('tone', t.tone);
          const pk = { kind: 'tone' as const, name: t.tone };
          return (
            <g key={t.tone} role="button" tabIndex={0} aria-label={`What “${t.word.toLowerCase()}” means`} className="ob-spot" onClick={() => pick(pk)} onKeyDown={key(pk)}>
              <rect x={p.x - 36} y={p.y - 10} width="72" height="20" fill="transparent" />
              <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize="9.5" letterSpacing="1.6" fill={on ? '#ffe7a8' : '#c9b2a0'} fontWeight={on ? 700 : 400} className={on ? 'ob-glow' : undefined}>
                {t.word}
              </text>
            </g>
          );
        })}
        {/* A halo of light behind the ball, and its stand */}
        <circle cx={C} cy={C} r={ORB_R + 16} fill="url(#ob-halo)" className="ob-halo" />
        <ellipse cx={C} cy={C + ORB_R + 20} rx="46" ry="7" fill="#000" opacity="0.35" />
        <path d={`M ${C - 40} ${C + ORB_R + 18} C ${C - 36} ${C + ORB_R + 6}, ${C - 22} ${C + ORB_R + 2}, ${C - 18} ${C + ORB_R - 6} L ${C + 18} ${C + ORB_R - 6} C ${C + 22} ${C + ORB_R + 2}, ${C + 36} ${C + ORB_R + 6}, ${C + 40} ${C + ORB_R + 18} Z`} fill="url(#ob-gold)" />
        <rect x={C - 46} y={C + ORB_R + 16} width="92" height="7" rx="3.5" fill="url(#ob-gold)" />
      </svg>

      <div className="crystal-wrap" style={{ left: `${((C - ORB_R) / SIZE) * 100}%`, top: `${((C - ORB_R) / SIZE) * 100}%`, width: `${((2 * ORB_R) / SIZE) * 100}%` }}>
        <CrystalOrb
          phase={phase}
          quiet={words.length > 0}
          onHoldChange={(h) => {
            setHolding(h);
            if (!h) onOrb?.();
          }}
        />
      </div>

      {/* Glass highlights, the claws that hold the ball, and the words that rise in it */}
      <svg className="ob-overlay" viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
        <defs>
          <radialGradient id="ob-spec" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#fff" stopOpacity="0.85" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ob-gold2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f6dc98" />
            <stop offset="1" stopColor="#8a6327" />
          </linearGradient>
        </defs>
        <ellipse cx={C - 26} cy={C - 36} rx="24" ry="12" fill="url(#ob-spec)" opacity="0.55" transform={`rotate(-32 ${C - 26} ${C - 36})`} />
        <circle cx={C - 36} cy={C - 41} r="3.2" fill="#fff" opacity="0.9" />
        <path d={`M ${C + 38} ${C + 44} a ${ORB_R - 6} ${ORB_R - 6} 0 0 0 ${18} ${-30}`} stroke="#fff" strokeOpacity="0.25" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx={C} cy={C} r={ORB_R} fill="none" stroke="url(#ob-gold2)" strokeWidth="1.5" strokeOpacity="0.8" />
        {[-1, 1].map((k) => (
          <path key={k} d={`M ${C + k * 30} ${C + ORB_R + 2} C ${C + k * 34} ${C + ORB_R - 8}, ${C + k * 40} ${C + ORB_R - 16}, ${C + k * 44} ${C + ORB_R - 24}`} stroke="url(#ob-gold2)" strokeWidth="4" fill="none" strokeLinecap="round" />
        ))}
        {words.length > 0 && (
          <text key={text} x={C} y={C + 6 - (words.length - 1) * 9} textAnchor="middle" fill="#fff8e6" fontSize={words.some((w) => w.length > 9) ? 12.5 : 15} letterSpacing="1.5" fontWeight={600} className={`ob-words ${phase === 'idle' ? 'ob-breathe' : 'ob-reveal'}`}>
            {words.map((w, i) => (
              <tspan key={`${w}-${i}`} x={C} dy={i ? 18 : 0}>
                {w}
              </tspan>
            ))}
          </text>
        )}
      </svg>

      {/* The pointer: drag it onto anything on the board */}
      <svg
        className="ob-planchette"
        viewBox="0 0 64 64"
        role="img"
        aria-label="The pointer. Drag it onto a planet, sign, or answer."
        style={{ left: `${(pos.x / SIZE) * 100}%`, top: `${(pos.y / SIZE) * 100}%` }}
        onPointerDown={(e) => {
          if (phase === 'seeking') return;
          wrapEl.current?.setPointerCapture?.(e.pointerId);
          setDragging(true);
        }}
      >
        <defs>
          <linearGradient id="ob-lens-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fbe3a0" />
            <stop offset="1" stopColor="#b98a3c" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="22" fill="transparent" />
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
