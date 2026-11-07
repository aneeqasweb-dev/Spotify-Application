import { hashString } from '../../utils/cover'

// Purple-family gradients so every avatar matches the theme (the same name always gets the same one)
const GRADIENTS = [
  ['#a78bfa', '#7c3aed'],
  ['#c084fc', '#9333ea'],
  ['#f0abfc', '#c026d3'],
  ['#818cf8', '#6d28d9'],
  ['#f9a8d4', '#a855f7'],
  ['#c4b5fd', '#8b5cf6'],
  ['#e879f9', '#7c3aed'],
  ['#a5b4fc', '#7c3aed'],
]

export default function Avatar({ name = '?', seed, size = 'sm', className = '' }) {
  const [a, b] = GRADIENTS[hashString(String(seed ?? name)) % GRADIENTS.length]
  return (
    <span
      className={`avatar avatar-${size} ${className}`}
      style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
      aria-hidden="true"
    >
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  )
}
