import { useEffect, useRef } from 'react'
import { ChevronDown, ExternalLink } from 'lucide-react'
import { usePlayer } from '../../context/PlayerContext'
import { useDominantColor } from '../../hooks/useDominantColor'
import { coverArt } from '../../utils/cover'
import Cover from '../music/Cover'
import { ArtistLinks } from '../music/TrackList'
import Equalizer from '../ui/Equalizer'
import LikeButton from '../ui/LikeButton'
import PreviewBadge from '../ui/PreviewBadge'
import { SeekBar, TransportControls, VolumeControl } from './PlayerControls'

// Full-screen "now playing" view, tinted with the cover's colour
export default function NowPlaying() {
  const p = usePlayer()
  const { current: track, expanded, setExpanded, upNext, jumpTo, playFromQueue, isPlaying } = p
  const dialogRef = useRef(null)
  const tint = useDominantColor(track?.coverUrl, track ? coverArt(track.id).colors[0] : '#2a5bd7')

  useEffect(() => {
    if (!expanded) return undefined
    dialogRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && setExpanded(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [expanded, setExpanded])

  if (!expanded || !track) return null

  // Queued songs first, then the rest of the album / playlist
  const coming = [
    ...upNext.manual.map((t, k) => ({ t, key: `q${k}-${t.id}`, play: () => playFromQueue(k) })),
    ...upNext.fromList.map(({ track: t, index }) => ({ t, key: `l${index}-${t.id}`, play: () => jumpTo(index) })),
  ].slice(0, 30)

  return (
    <div
      className="np"
      role="dialog"
      aria-modal="true"
      aria-label="Now playing"
      ref={dialogRef}
      tabIndex={-1}
      style={{ '--np-a': tint }}
    >
      <div className="np-bg" aria-hidden="true" />
      <header className="np-head">
        <button type="button" className="round-btn" onClick={() => setExpanded(false)} aria-label="Close full screen player">
          <ChevronDown />
        </button>
        <div className="np-context">
          <span>Playing from</span>
          <strong>{p.context?.label ?? 'Beat Flow'}</strong>
        </div>
        <span className="np-head-spacer" />
      </header>

      <div className="np-body">
        <div className="np-main">
          <div className={`np-art${isPlaying ? ' is-playing' : ''}`}>
            <Cover src={track.coverUrl} seed={track.id} title={track.title} label res={880} eager />
          </div>
          <div className="np-meta">
            <div className="np-meta-text">
              <h2>{track.title}</h2>
              <ArtistLinks track={track} className="np-artists" />
            </div>
            <LikeButton track={track} size={24} className="np-like" />
          </div>
          <SeekBar />
          <TransportControls large />
          <VolumeControl />
          {track.isPreview && track.externalUrl && (
            <p className="np-preview">
              <PreviewBadge /> You’re hearing a 30-second preview.
              <a href={track.externalUrl} target="_blank" rel="noreferrer">
                Listen to the full song on Apple Music <ExternalLink size={14} />
              </a>
            </p>
          )}
        </div>

        <aside className="np-queue" aria-label="Up next">
          <h3>Up next</h3>
          {coming.length ? (
            <ol>
              {coming.map(({ t, key, play }) => (
                <li key={key}>
                  <button type="button" className="np-queue-item" onClick={play}>
                    <Cover src={t.coverUrl} seed={t.id} size={44} />
                    <span className="np-queue-text">
                      <strong>{t.title}</strong>
                      <small>{t.byline}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="np-queue-empty">
              <Equalizer playing={isPlaying} /> That's the end of the queue.
            </p>
          )}
          {track.credits && <p className="np-credits">{track.credits}</p>}
        </aside>
      </div>
    </div>
  )
}
