import { useId } from 'react'

export function LogoMark({ size = 32 }) {
  // useId keeps gradient ids unique when several logos are on screen
  const id = `bf-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="logo-mark">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset=".55" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#5b21b6" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="16" fill={`url(#${id})`} />
      <g fill="#fff">
        <rect x="8" y="13.5" width="2.6" height="5" rx="1.3" />
        <rect x="12.4" y="10" width="2.6" height="12" rx="1.3" />
        <rect x="16.8" y="7.5" width="2.6" height="17" rx="1.3" />
        <rect x="21.2" y="11.5" width="2.6" height="9" rx="1.3" />
      </g>
    </svg>
  )
}

export function Logo({ size = 32 }) {
  return (
    <span className="logo">
      <LogoMark size={size} />
      <span className="logo-word">
        Beat<span className="logo-accent">Flow</span>
      </span>
    </span>
  )
}
