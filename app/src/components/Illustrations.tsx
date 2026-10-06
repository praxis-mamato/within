/** Decorative illustrations from the concept renderings. All aria-hidden: they never carry meaning. */

export function Orbit() {
  return (
    <svg className="illo" viewBox="0 0 240 140" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="sun" cx="40%" cy="35%">
          <stop offset="0" stopColor="#e2c38a" />
          <stop offset="1" stopColor="#a8783a" />
        </radialGradient>
      </defs>
      <ellipse cx="120" cy="70" rx="80" ry="44" fill="none" stroke="#b8904f" strokeWidth="1.2" transform="rotate(-18 120 70)" />
      <ellipse cx="120" cy="70" rx="40" ry="34" fill="none" stroke="#b8904f" strokeWidth="1" opacity="0.7" />
      <circle cx="120" cy="70" r="15" fill="url(#sun)" />
      <circle cx="44" cy="86" r="4.5" fill="#b5583f" />
    </svg>
  );
}

export function Venn() {
  return (
    <svg className="illo" viewBox="0 0 240 150" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="rose" cx="40%" cy="40%">
          <stop offset="0" stopColor="#e9b7a3" />
          <stop offset="1" stopColor="#c47a62" />
        </radialGradient>
        <radialGradient id="stone" cx="55%" cy="40%">
          <stop offset="0" stopColor="#f1ebe3" />
          <stop offset="1" stopColor="#cfc4b8" />
        </radialGradient>
      </defs>
      <circle cx="96" cy="75" r="46" fill="url(#rose)" opacity="0.85" />
      <circle cx="146" cy="75" r="46" fill="url(#stone)" opacity="0.8" />
      <ellipse cx="120" cy="80" rx="108" ry="22" fill="none" stroke="#b8904f" strokeWidth="1" transform="rotate(-6 120 80)" />
      <circle cx="28" cy="88" r="4" fill="#a8783a" />
      <circle cx="208" cy="70" r="4" fill="#4a1d33" />
    </svg>
  );
}

export function Leaf() {
  return (
    <svg viewBox="0 0 48 64" width="44" height="58" aria-hidden="true" focusable="false">
      <path d="M24 60 C 22 40, 26 22, 40 6 C 44 24, 36 44, 24 60 Z" fill="#c9a36a" opacity="0.85" />
      <path d="M24 60 C 30 40, 34 26, 40 6" fill="none" stroke="#8a6a3c" strokeWidth="1.2" />
      <path d="M24 60 C 18 46, 10 38, 6 30 C 16 34, 22 44, 24 60 Z" fill="#7d8466" opacity="0.8" />
    </svg>
  );
}

export function HorizonSun() {
  return (
    <svg className="illo" viewBox="0 0 240 120" aria-hidden="true" focusable="false">
      {[70, 56, 42].map((r) => (
        <path key={r} d={`M ${120 - r} 84 A ${r} ${r} 0 0 1 ${120 + r} 84`} fill="none" stroke="#cdb38a" strokeWidth="1" />
      ))}
      <path d="M 86 84 A 34 34 0 0 1 154 84 Z" fill="#9b938c" opacity="0.6" />
      <circle cx="120" cy="34" r="12" fill="#c49a55" />
      {[90, 96, 102, 108].map((y, i) => (
        <rect key={y} x={100 - i * 4} y={y} width={40 + i * 8} height="2.5" rx="1.25" fill="#c49a55" opacity={0.8 - i * 0.15} />
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
          <stop offset="0" stopColor="#f7f0e8" />
          <stop offset="1" stopColor="#efe2cf" />
        </linearGradient>
        <linearGradient id="river" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9dccb" />
          <stop offset="1" stopColor="#f7f0e8" />
        </linearGradient>
      </defs>
      <rect width="400" height="170" fill="url(#sky)" />
      <circle cx="232" cy="58" r="20" fill="#e2b979" opacity="0.85" />
      <path d="M0 92 C 60 62, 120 70, 170 84 C 220 98, 280 64, 400 80 L400 170 L0 170 Z" fill="#d8c7b2" />
      <path d="M0 108 C 80 86, 150 100, 220 104 C 290 108, 340 90, 400 100 L400 170 L0 170 Z" fill="#c2b08f" />
      <path d="M0 126 C 70 112, 140 122, 200 124 C 270 126, 330 114, 400 120 L400 170 L0 170 Z" fill="#8f936f" opacity="0.85" />
      <path d="M190 170 C 200 150, 236 140, 214 126 C 204 120, 230 116, 246 114 L 258 114 C 246 120, 226 124, 236 132 C 258 146, 230 160, 236 170 Z" fill="url(#river)" />
      {[30, 52, 330, 360, 378].map((x, i) => (
        <path key={x} d={`M${x} ${150 - (i % 2) * 8} l4 -22 l4 22 Z`} fill="#6f7556" opacity="0.7" />
      ))}
    </svg>
  );
}
