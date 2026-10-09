import type { CrossAspect, Point } from '../astro/relationship';

const SIZE = 340;
const C = SIZE / 2;
const ZODIAC = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
const GLYPH: Record<string, string> = { Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇', 'North Node': '☊', Ascendant: 'AC', Midheaven: 'MC' };
const COLOR: Record<string, string> = { conjunct: '#b98a3c', trine: '#4f7a5a', sextile: '#4f7a5a', square: '#a8492f', opposite: '#a8492f' };

/**
 * A synastry bi-wheel: your planets on the inner ring, theirs on the outer ring, and the strongest
 * contacts between you drawn across the middle (green flows, red asks for adjustment, gold blends).
 */
export function SynastryWheel({ mine, theirs, aspects, asc, name }: { mine: Point[]; theirs: Point[]; aspects: CrossAspect[]; asc: number | null; name: string }) {
  // Your rising sign on the left, as on a chart wheel; Aries on the left without a birth time.
  const rot = asc ?? 0;
  const at = (lon: number, r: number) => {
    const a = ((180 + rot - lon) * Math.PI) / 180;
    return { x: C + r * Math.cos(a), y: C - r * Math.sin(a) };
  };
  const spread = (pts: Point[], r: number) => {
    const placed: { p: Point; r: number }[] = [];
    for (const p of [...pts].sort((x, y) => x.lon - y.lon)) {
      const near = placed.filter((q) => Math.abs(((q.p.lon - p.lon + 540) % 360) - 180) < 7).length;
      placed.push({ p, r: r - near * 13 });
    }
    return placed;
  };
  const inner = spread(mine.filter((p) => p.name !== 'Midheaven'), 86);
  const outer = spread(theirs.filter((p) => p.name !== 'Midheaven'), 124);
  const lineR = 58;
  return (
    <figure className="syn-wheel">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`Synastry wheel: your planets inside, ${name}’s outside, with ${aspects.length} contacts between you drawn across the middle.`}>
        <circle cx={C} cy={C} r={166} fill="var(--surface)" stroke="var(--line)" />
        <circle cx={C} cy={C} r={146} fill="none" stroke="var(--line)" />
        <circle cx={C} cy={C} r={104} fill="none" stroke="var(--line)" strokeDasharray="2 3" />
        <circle cx={C} cy={C} r={lineR} fill="var(--bg)" stroke="var(--line)" />
        {ZODIAC.map((g, i) => {
          const a = at(i * 30, 146);
          const b = at(i * 30, 166);
          const t = at(i * 30 + 15, 156);
          return (
            <g key={g}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--line)" />
              <text x={t.x} y={t.y} textAnchor="middle" dominantBaseline="central" fontSize="12" fill="var(--gold)">
                {`${g}︎`}
              </text>
            </g>
          );
        })}
        {aspects.map((x, i) => {
          const pa = mine.find((p) => p.name === x.a);
          const pb = theirs.find((p) => p.name === x.b);
          if (!pa || !pb) return null;
          const a = at(pa.lon, lineR);
          const b = at(pb.lon, lineR);
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={COLOR[x.aspect]} strokeWidth={Math.max(0.8, 2.4 - x.orb / 2.5)} strokeOpacity="0.75" />;
        })}
        {inner.map(({ p, r }) => {
          const q = at(p.lon, r);
          const tick = at(p.lon, lineR);
          return (
            <g key={`m-${p.name}`}>
              <circle cx={tick.x} cy={tick.y} r="2" fill="var(--west)" />
              <text x={q.x} y={q.y} textAnchor="middle" dominantBaseline="central" fontSize={GLYPH[p.name].length > 1 ? 9 : 14} fill="var(--west)" fontWeight={600}>
                {`${GLYPH[p.name]}︎`}
              </text>
            </g>
          );
        })}
        {outer.map(({ p, r }) => {
          const q = at(p.lon, r);
          const tick = at(p.lon, lineR);
          return (
            <g key={`t-${p.name}`}>
              <circle cx={tick.x} cy={tick.y} r="2" fill="var(--vedic)" />
              <text x={q.x} y={q.y} textAnchor="middle" dominantBaseline="central" fontSize={GLYPH[p.name].length > 1 ? 9 : 14} fill="var(--vedic)" fontWeight={600}>
                {`${GLYPH[p.name]}︎`}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="small">
        <span className="syn-key" style={{ color: 'var(--west)' }}>● You (inside)</span> <span className="syn-key" style={{ color: 'var(--vedic)' }}>● {name} (outside)</span>
        <br />
        <span className="syn-key" style={{ color: '#4f7a5a' }}>— flows</span> <span className="syn-key" style={{ color: '#a8492f' }}>— asks for adjustment</span> <span className="syn-key" style={{ color: '#b98a3c' }}>— blends</span>
      </figcaption>
    </figure>
  );
}
