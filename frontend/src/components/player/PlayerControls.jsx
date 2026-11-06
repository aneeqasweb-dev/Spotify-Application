import { useState } from 'react'
import {
  LoaderCircle, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume1, Volume2, VolumeX,
} from 'lucide-react'
import { usePlayer, usePlayerProgress } from '../../context/PlayerContext'
import { formatTime } from '../../utils/format'

export function MainPlayIcon() {
  const { isPlaying, isBuffering } = usePlayer()
  if (isBuffering) return <LoaderCircle className="spin" />
  return isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="play-icon" />
}

export function TransportControls({ large = false }) {
  const p = usePlayer()
  const disabled = !p.current
  const RepeatIcon = p.repeat === 'one' ? Repeat1 : Repeat
  const repeatLabel = { off: 'Repeat off', all: 'Repeat all', one: 'Repeat one' }[p.repeat]

  return (
    <div className={`transport${large ? ' transport-lg' : ''}`}>
      <button
        type="button"
        className={`ctrl${p.shuffle ? ' is-active' : ''}`}
        onClick={p.toggleShuffle}
        aria-pressed={p.shuffle}
        aria-label="Shuffle"
        title="Shuffle"
      >
        <Shuffle />
      </button>
      <button type="button" className="ctrl" onClick={p.prev} disabled={disabled} aria-label="Previous" title="Previous">
        <SkipBack fill="currentColor" />
      </button>
      <button
        type="button"
        className="ctrl-main"
        onClick={p.togglePlay}
        disabled={disabled}
        aria-label={p.isPlaying ? 'Pause' : 'Play'}
      >
        <MainPlayIcon />
      </button>
      <button type="button" className="ctrl" onClick={p.next} disabled={disabled} aria-label="Next" title="Next">
        <SkipForward fill="currentColor" />
      </button>
      <button
        type="button"
        className={`ctrl${p.repeat !== 'off' ? ' is-active' : ''}`}
        onClick={p.cycleRepeat}
        aria-label={repeatLabel}
        title={repeatLabel}
      >
        <RepeatIcon />
      </button>
    </div>
  )
}

export function SeekBar() {
  const { currentTime, duration } = usePlayerProgress()
  const { seek, current } = usePlayer()
  const [dragValue, setDragValue] = useState(null)

  const value = dragValue ?? currentTime
  const max = duration || 0
  const pct = max ? Math.min((value / max) * 100, 100) : 0

  const commit = (v) => {
    seek(v)
    setDragValue(null)
  }

  return (
    <div className="seek">
      <span className="seek-time">{formatTime(value)}</span>
      <input
        type="range"
        className="range"
        min={0}
        max={max || 1}
        step={0.1}
        value={Math.min(value, max || 1)}
        disabled={!current || !max}
        style={{ '--fill': `${pct}%` }}
        onChange={(e) => setDragValue(Number(e.target.value))}
        onPointerUp={(e) => commit(Number(e.currentTarget.value))}
        onKeyUp={(e) => commit(Number(e.currentTarget.value))}
        aria-label="Seek"
        aria-valuetext={`${formatTime(value)} of ${formatTime(max)}`}
      />
      <span className="seek-time">{formatTime(max)}</span>
    </div>
  )
}

export function VolumeControl() {
  const { volume, muted, setVolume, toggleMute } = usePlayer()
  const level = muted ? 0 : volume
  const Icon = level === 0 ? VolumeX : level < 0.5 ? Volume1 : Volume2

  return (
    <div className="volume">
      <button type="button" className="ctrl" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'} title={muted ? 'Unmute' : 'Mute'}>
        <Icon />
      </button>
      <input
        type="range"
        className="range"
        min={0}
        max={1}
        step={0.01}
        value={level}
        onChange={(e) => setVolume(Number(e.target.value))}
        style={{ '--fill': `${level * 100}%` }}
        aria-label="Volume"
      />
    </div>
  )
}
