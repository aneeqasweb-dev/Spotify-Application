import { coverArt } from '../../utils/cover'

export default function Avatar({ name = '?', seed, size = 'sm', className = '' }) {
  const [a, b] = coverArt(seed ?? name).colors
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
