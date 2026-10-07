/**
 * The welcome illustration: a natal-chart wheel in a night sky, rising over the Rendering B
 * landscape at dawn. Self-contained colors (it carries its own sky), so it reads the same in
 * light and dark mode and can be exported as a static file for link previews (scripts/og.mjs).
 */
const GLYPHS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
const CX = 200;
const CY = 168;
const pt = (r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)] as const;
};
// A fixed, hand-placed starfield (no randomness, so renders are identical).
const STARS: [number, number, number][] = [
  [42, 52, 1.4], [78, 30, 1], [118, 64, 0.9], [150, 26, 1.3], [256, 34, 1], [292, 58, 1.5], [330, 30, 0.9], [356, 74, 1.2],
  [60, 98, 0.8], [344, 120, 0.8], [30, 140, 1.1], [372, 156, 1], [96, 120, 0.7], [310, 96, 0.7], [226, 18, 0.8], [176, 48, 0.6],
];
// Planets on the wheel: [degrees, ring radius, color].
const PLANETS: [number, number, string][] = [
  [28, 70, '#E9C98F'], [76, 62, '#F3E9DC'], [142, 70, '#C47A62'], [204, 62, '#8FA6D6'], [262, 70, '#E9C98F'], [318, 62, '#B9C29A'],
];

export function Hero({ title = 'A natal chart wheel in a night sky over a dawn landscape' }: { title?: string }) {
  const aspects = [[28, 142], [142, 262], [262, 28], [76, 204]] as const;
  return (
    <svg className="hero" viewBox="0 0 400 300" role="img" aria-label={title}>
      <defs>
        <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1E1530" />
          <stop offset="0.62" stopColor="#3A1A2C" />
          <stop offset="1" stopColor="#A8492F" />
        </linearGradient>
        <radialGradient id="hero-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#F6D9A0" />
          <stop offset="1" stopColor="#E2B979" stopOpacity="0" />
        </radialGradient>
        <clipPath id="hero-arch">
          <path d="M16 300 V150 A184 150 0 0 1 384 150 V300 Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#hero-arch)">
        <rect width="400" height="300" fill="url(#hero-sky)" />
        {STARS.map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#F3E9DC" opacity={0.55 + r / 4} />
        ))}
        {/* A small constellation */}
        <polyline points="292,58 330,30 356,74 344,120" fill="none" stroke="#F3E9DC" strokeOpacity="0.35" strokeWidth="0.8" />
        <circle cx={CX} cy={262} r="90" fill="url(#hero-sun)" />
        {/* Chart wheel */}
        <circle cx={CX} cy={CY} r="104" fill="#1E1530" fillOpacity="0.55" stroke="#E2C38A" strokeWidth="1.4" />
        <circle cx={CX} cy={CY} r="84" fill="none" stroke="#E2C38A" strokeOpacity="0.7" strokeWidth="0.8" />
        <circle cx={CX} cy={CY} r="52" fill="none" stroke="#E2C38A" strokeOpacity="0.45" strokeWidth="0.8" />
        {GLYPHS.map((g, i) => {
          const [x1, y1] = pt(84, i * 30);
          const [x2, y2] = pt(104, i * 30);
          const [gx, gy] = pt(94, i * 30 + 15);
          return (
            <g key={g}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#E2C38A" strokeOpacity="0.7" strokeWidth="0.8" />
              <text x={gx} y={gy} fill="#E9C98F" fontSize="11" textAnchor="middle" dominantBaseline="central" fontFamily="'Segoe UI Symbol','Noto Sans Symbols 2','Apple Symbols',serif">
                {`${g}︎`}
              </text>
            </g>
          );
        })}
        {aspects.map(([a, b]) => {
          const [x1, y1] = pt(52, a);
          const [x2, y2] = pt(52, b);
          return <line key={`${a}-${b}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#E2C38A" strokeOpacity="0.55" strokeWidth="0.9" />;
        })}
        {PLANETS.map(([deg, r, color]) => {
          const [x, y] = pt(r, deg);
          return <circle key={deg} cx={x} cy={y} r="4.2" fill={color} stroke="#1E1530" strokeWidth="1.2" />;
        })}
        <circle cx={CX} cy={CY} r="5" fill="#F6D9A0" />
        {/* Dawn landscape (Rendering B) */}
        <path d="M0 236 C 60 214, 120 222, 170 232 C 220 242, 290 214, 400 226 L400 300 L0 300 Z" fill="#8F6F7A" />
        <path d="M0 254 C 80 236, 150 248, 220 250 C 290 252, 340 240, 400 248 L400 300 L0 300 Z" fill="#6B5A6E" />
        <path d="M0 274 C 70 262, 140 270, 200 272 C 270 274, 330 264, 400 270 L400 300 L0 300 Z" fill="#4A3D52" />
        <path d="M190 300 C 198 288, 222 282, 210 274 C 204 270, 222 267, 232 266 L 240 266 C 232 270, 220 273, 226 278 C 240 286, 222 294, 228 300 Z" fill="#E2B979" opacity="0.7" />
      </g>
      <path d="M16 300 V150 A184 150 0 0 1 384 150 V300" fill="none" stroke="#B58A45" strokeWidth="1.5" />
    </svg>
  );
}
