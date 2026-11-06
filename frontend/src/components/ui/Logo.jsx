import { useId } from 'react'

export function LogoMark({ size = 32 }) {
  // useId keeps gradient ids unique when several logos are on screen
  const id = `bf-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="logo-mark">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2f6bff" />
          <stop offset=".55" stopColor="#4c9dff" />
          <stop offset="1" stopColor="#3fd0ff" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${id})`} />
      <g fill="#040b1c">
        <rect x="7" y="13" width="3" height="6" rx="1.5" />
        <rect x="12" y="9" width="3" height="14" rx="1.5" />
        <rect x="17" y="6.5" width="3" height="19" rx="1.5" />
        <rect x="22" y="11" width="3" height="10" rx="1.5" />
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
