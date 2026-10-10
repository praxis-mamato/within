import { useState } from 'react';
import type { EnergyAspect } from '../content/energy';

const SIZE = 340;
const C = SIZE / 2;
const ZODIAC = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
const GLYPH: Record<string, string> = { Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇', Node: '☊' };
const COLOR = { tension: '#ff8a6b', flow: '#7fd39a', fusion: '#f3d07a' };
type Kind = keyof typeof COLOR;

/**
 * Your birth chart as energy: planets around the wheel, tension lines in coral, flowing lines in
 * green, fusions in gold. Tap a kind of line to show only those.
 */
export function EnergyWheel({ planets, aspects, asc }: { planets: { body: string; longitude: number; retrograde?: boolean }[]; aspects: EnergyAspect[]; asc: number | null }) {
  const [only, setOnly] = useState<Kind | null>(null);
  const rot = asc ?? 0;
  const at = (lon: number, r: number) => {
    const a = ((180 + rot - lon) * Math.PI) / 180;
    return { x: C + r * Math.cos(a), y: C - r * Math.sin(a) };
  };
  const placed: { body: string; lon: number; r: number; rx?: boolean }[] = [];
  for (const p of [...planets].filter((x) => GLYPH[x.body]).sort((x, y) => x.longitude - y.longitude)) {
    const near = placed.filter((q) => Math.abs(((q.lon - p.longitude + 540) % 360) - 180) < 8).length;
    placed.push({ body: p.body, lon: p.longitude, r: 116 - near * 14, rx: p.retrograde });
  }
  const lineR = 82;
  const shown = aspects.filter((x) => !only || x.kind === only);
  return (
    <figure className="energy-wheel">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`Your birth chart with ${aspects.filter((x) => x.kind === 'tension').length} tension lines, ${aspects.filter((x) => x.kind === 'flow').length} flowing lines, and ${aspects.filter((x) => x.kind === 'fusion').length} fusions.`}>
        <circle cx={C} cy={C} r={166} fill="#121a3d" stroke="#c9a15a" strokeOpacity="0.6" />
        <circle cx={C} cy={C} r={146} fill="none" stroke="#c9a15a" strokeOpacity="0.35" />
        <circle cx={C} cy={C} r={lineR} fill="#0b1030" stroke="#c9a15a" strokeOpacity="0.35" />
        {ZODIAC.map((g, i) => {
          const a = at(i * 30, 146);
          const b = at(i * 30, 166);
          const t = at(i * 30 + 15, 156);
          return (
            <g key={g}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#c9a15a" strokeOpacity="0.35" />
              <text x={t.x} y={t.y} textAnchor="middle" dominantBaseline="central" fontSize="12" fill="#e2c27e">
                {`${g}︎`}
              </text>
            </g>
          );
        })}
        {shown.map((x, i) => {
          const pa = planets.find((p) => p.body === x.a);
          const pb = planets.find((p) => p.body === x.b);
          if (!pa || !pb) return null;
          const a = at(pa.longitude, lineR);
          const b = at(pb.longitude, lineR);
          if (x.kind === 'fusion') return <circle key={i} cx={(a.x + b.x) / 2} cy={(a.y + b.y) / 2} r={5} fill="none" stroke={COLOR.fusion} strokeWidth="2" />;
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={COLOR[x.kind]} strokeWidth={Math.max(1, 3 - x.orb / 2.5)} strokeOpacity="0.85" strokeDasharray={x.aspect === 'sextile' ? '4 3' : undefined} />;
        })}
        {placed.map((p) => {
          const q = at(p.lon, p.r);
          const tick = at(p.lon, lineR);
          return (
            <g key={p.body}>
              <circle cx={tick.x} cy={tick.y} r="2.4" fill="#fff6e6" />
              <text x={q.x} y={q.y} textAnchor="middle" dominantBaseline="central" fontSize="15" fill="#fff6e6" fontWeight={600}>
                {`${GLYPH[p.body]}︎`}
              </text>
              {p.rx && (
                <text x={q.x + 10} y={q.y + 8} fontSize="8" fill="#e2c27e">
                  ℞
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="energy-key" role="group" aria-label="Show only one kind of line">
        {(['tension', 'flow', 'fusion'] as Kind[]).map((k) => (
          <button key={k} type="button" aria-pressed={only === k} onClick={() => setOnly(only === k ? null : k)} style={{ color: COLOR[k] }}>
            {k === 'tension' ? '— tension' : k === 'flow' ? '— flow' : '○ fusion'}
          </button>
        ))}
      </figcaption>
    </figure>
  );
}
