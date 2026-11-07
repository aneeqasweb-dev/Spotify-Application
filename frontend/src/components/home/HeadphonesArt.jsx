// Purple headphones illustration for the Home banner (pure SVG, so it stays sharp at any size)
export default function HeadphonesArt({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 420 330" role="img" aria-label="Headphones">
      <defs>
        <linearGradient id="hp-band" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b9a2ff" />
          <stop offset="0.5" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#5b21b6" />
        </linearGradient>
        <linearGradient id="hp-shell" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c4b5fd" />
          <stop offset="0.45" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#4c1d95" />
        </linearGradient>
        <radialGradient id="hp-face" cx="0.38" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#ddd6fe" />
          <stop offset="0.55" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#6d28d9" />
        </radialGradient>
        <radialGradient id="hp-cushion" cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#3b0764" />
          <stop offset="1" stopColor="#6d28d9" />
        </radialGradient>
        <filter id="hp-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#5b21b6" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* sparkles */}
      {[
        [40, 80, 1.1],
        [372, 112, 1.3],
        [396, 70, 0.6],
        [360, 170, 0.45],
      ].map(([x, y, s], i) => (
        <path
          key={i}
          transform={`translate(${x} ${y}) scale(${s})`}
          d="M0 -18 C2 -4 4 -2 18 0 C4 2 2 4 0 18 C-2 4 -4 2 -18 0 C-4 -2 -2 -4 0 -18Z"
          fill="#8b5cf6"
          opacity={0.85 - i * 0.12}
        />
      ))}

      <g filter="url(#hp-shadow)">
        {/* headband */}
        <path d="M98 205 C 92 70, 328 70, 322 205" fill="none" stroke="url(#hp-band)" strokeWidth="30" strokeLinecap="round" />
        <path d="M112 190 C 112 95, 308 95, 308 190" fill="none" stroke="#ede9fe" strokeOpacity="0.45" strokeWidth="6" strokeLinecap="round" />
        {/* sliders */}
        <rect x="80" y="178" width="34" height="56" rx="12" fill="url(#hp-shell)" />
        <rect x="306" y="178" width="34" height="56" rx="12" fill="url(#hp-shell)" />

        {/* left ear cup (seen from the side) */}
        <g transform="translate(96 250) rotate(-8)">
          <rect x="-46" y="-62" width="92" height="124" rx="44" fill="url(#hp-shell)" />
          <ellipse cx="10" cy="0" rx="30" ry="48" fill="url(#hp-cushion)" />
          <ellipse cx="14" cy="0" rx="16" ry="30" fill="#1e0b3a" opacity="0.55" />
        </g>

        {/* right ear cup (front) */}
        <g transform="translate(322 250) rotate(8)">
          <rect x="-50" y="-66" width="100" height="132" rx="48" fill="url(#hp-shell)" />
          <ellipse cx="0" cy="0" rx="40" ry="54" fill="url(#hp-face)" />
          <ellipse cx="-10" cy="-16" rx="14" ry="20" fill="#fff" opacity="0.28" />
          <ellipse cx="0" cy="0" rx="40" ry="54" fill="none" stroke="#ede9fe" strokeOpacity="0.5" strokeWidth="2" />
        </g>
      </g>
    </svg>
  )
}
