/** Decorative illustrations from the concept renderings. All aria-hidden: they never carry meaning. */

export function Orbit() {
  return (
    <svg className="illo" viewBox="0 0 240 140" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="sun" cx="40%" cy="35%">
          <stop offset="0" style={{ stopColor: 'var(--sun-hi)' }} />
          <stop offset="1" style={{ stopColor: 'var(--sun-lo)' }} />
        </radialGradient>
      </defs>
      <ellipse cx="120" cy="70" rx="80" ry="44" fill="none" style={{ stroke: 'var(--gold)' }} strokeWidth="1.5" transform="rotate(-18 120 70)" />
      <ellipse cx="120" cy="70" rx="40" ry="34" fill="none" style={{ stroke: 'var(--gold)' }} strokeWidth="1" opacity="0.7" />
      <circle cx="120" cy="70" r="15" fill="url(#sun)" />
      <circle cx="44" cy="86" r="4.5" style={{ fill: 'var(--west)' }} />
      <rect x="191" y="46" width="8" height="8" rx="1" style={{ fill: 'var(--vedic)' }} />
    </svg>
  );
}

export function Venn() {
  return (
    <svg className="illo" viewBox="0 0 240 150" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="rose" cx="40%" cy="40%">
          <stop offset="0" style={{ stopColor: 'var(--rose-hi)' }} />
          <stop offset="1" style={{ stopColor: 'var(--rose-lo)' }} />
        </radialGradient>
        <radialGradient id="stone" cx="55%" cy="40%">
          <stop offset="0" style={{ stopColor: 'var(--stone-hi)' }} />
          <stop offset="1" style={{ stopColor: 'var(--stone-lo)' }} />
        </radialGradient>
      </defs>
      <circle cx="96" cy="75" r="46" fill="url(#rose)" opacity="0.85" />
      <circle cx="146" cy="75" r="46" fill="url(#stone)" opacity="0.8" />
      <ellipse cx="120" cy="80" rx="108" ry="22" fill="none" style={{ stroke: 'var(--gold)' }} strokeWidth="1" transform="rotate(-6 120 80)" />
      <circle cx="28" cy="88" r="4" style={{ fill: 'var(--sun-lo)' }} />
      <circle cx="208" cy="70" r="4" style={{ fill: 'var(--vedic)' }} />
    </svg>
  );
}

export function Leaf() {
  return (
    <svg viewBox="0 0 48 64" width="44" height="58" aria-hidden="true" focusable="false">
      <path d="M24 60 C 22 40, 26 22, 40 6 C 44 24, 36 44, 24 60 Z" style={{ fill: 'var(--leaf-1)' }} opacity="0.85" />
      <path d="M24 60 C 30 40, 34 26, 40 6" fill="none" style={{ stroke: 'var(--leaf-vein)' }} strokeWidth="1.2" />
      <path d="M24 60 C 18 46, 10 38, 6 30 C 16 34, 22 44, 24 60 Z" style={{ fill: 'var(--leaf-2)' }} opacity="0.8" />
    </svg>
  );
}

export function HorizonSun() {
  return (
    <svg className="illo" viewBox="0 0 240 120" aria-hidden="true" focusable="false">
      {[70, 56, 42].map((r) => (
        <path key={r} d={`M ${120 - r} 84 A ${r} ${r} 0 0 1 ${120 + r} 84`} fill="none" style={{ stroke: 'var(--horizon)' }} strokeWidth="1" />
      ))}
      <path d="M 86 84 A 34 34 0 0 1 154 84 Z" style={{ fill: 'var(--horizon-hill)' }} opacity="0.6" />
      <circle cx="120" cy="34" r="12" style={{ fill: 'var(--horizon-sun)' }} />
      {[90, 96, 102, 108].map((y, i) => (
        <rect key={y} x={100 - i * 4} y={y} width={40 + i * 8} height="2.5" rx="1.25" style={{ fill: 'var(--horizon-sun)' }} opacity={0.8 - i * 0.15} />
      ))}
    </svg>
  );
}

/** Rendering B landscape behind the relationship timeline (decision 6). */
export function Landscape() {
  return (
    <svg viewBox="0 0 400 170" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--land-sky-1)' }} />
          <stop offset="1" style={{ stopColor: 'var(--land-sky-2)' }} />
        </linearGradient>
        <linearGradient id="river" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--land-river)' }} />
          <stop offset="1" style={{ stopColor: 'var(--land-sky-1)' }} />
        </linearGradient>
      </defs>
      <rect width="400" height="170" fill="url(#sky)" />
      <circle cx="232" cy="58" r="20" style={{ fill: 'var(--land-sun)' }} opacity="0.85" />
      <path d="M0 92 C 60 62, 120 70, 170 84 C 220 98, 280 64, 400 80 L400 170 L0 170 Z" style={{ fill: 'var(--land-hill-1)' }} />
      <path d="M0 108 C 80 86, 150 100, 220 104 C 290 108, 340 90, 400 100 L400 170 L0 170 Z" style={{ fill: 'var(--land-hill-2)' }} />
      <path d="M0 126 C 70 112, 140 122, 200 124 C 270 126, 330 114, 400 120 L400 170 L0 170 Z" style={{ fill: 'var(--land-hill-3)' }} opacity="0.85" />
      <path d="M190 170 C 200 150, 236 140, 214 126 C 204 120, 230 116, 246 114 L 258 114 C 246 120, 226 124, 236 132 C 258 146, 230 160, 236 170 Z" fill="url(#river)" />
      {[30, 52, 330, 360, 378].map((x, i) => (
        <path key={x} d={`M${x} ${150 - (i % 2) * 8} l4 -22 l4 22 Z`} style={{ fill: 'var(--land-tree)' }} opacity="0.7" />
      ))}
    </svg>
  );
}

/** The Within mark: the Western circle and Vedic square overlapping, with the planet from the orbit. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="6 12 82 82" width={size} height={size} aria-hidden="true" focusable="false">
      <clipPath id="logo-overlap">
        <circle cx="60" cy="42" r="26" />
      </clipPath>
      <path d="M24 34 L66 26 L74 68 L32 76 Z" style={{ fill: 'var(--logo-gold)' }} fillOpacity="0.8" clipPath="url(#logo-overlap)" />
      <path d="M24 34 L66 26 L74 68 L32 76 Z" fill="none" style={{ stroke: 'var(--ink-display)' }} strokeWidth="6" strokeLinejoin="round" />
      <circle cx="60" cy="42" r="26" fill="none" style={{ stroke: 'var(--ink-display)' }} strokeWidth="6" />
      <circle cx="18" cy="80" r="8" style={{ fill: 'var(--logo-gold)' }} />
    </svg>
  );
}
