export default function Equalizer({ playing = true, className = '' }) {
  return (
    <span className={`eq${playing ? ' is-playing' : ''} ${className}`} aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  )
}
