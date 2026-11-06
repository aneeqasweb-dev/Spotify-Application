import { Pause, Play } from 'lucide-react'

export default function PlayButton({ playing, onClick, size = 'md', label = '', className = '', tabIndex }) {
  return (
    <button
      type="button"
      className={`play-btn play-btn-${size} ${className}`}
      tabIndex={tabIndex}
      onClick={(e) => {
        // Cards are links / clickable too — don't trigger them as well
        e.preventDefault()
        e.stopPropagation()
        onClick?.(e)
      }}
      aria-label={`${playing ? 'Pause' : 'Play'} ${label}`.trim()}
    >
      {playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="play-icon" />}
    </button>
  )
}
