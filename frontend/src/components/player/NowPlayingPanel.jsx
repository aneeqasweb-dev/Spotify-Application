import { Maximize2, Music2 } from 'lucide-react'
import { usePlayer } from '../../context/PlayerContext'
import Cover from '../music/Cover'
import { ArtistLinks } from '../music/TrackList'
import Equalizer from '../ui/Equalizer'
import LikeButton from '../ui/LikeButton'
import PreviewBadge from '../ui/PreviewBadge'
import { SeekBar, TransportControls, VolumeControl } from './PlayerControls'

// The right-hand "Now playing" panel on wide screens: big cover, controls and the queue
export default function NowPlayingPanel() {
  const p = usePlayer()
  const track = p.current

  if (!track) {
    return (
      <aside className="now-panel is-empty" aria-label="Now playing">
        <div className="now-cover now-cover-empty">
          <Music2 />
        </div>
        <h2 className="now-title">Nothing playing yet</h2>
        <p className="now-artist">Pick a song, album or playlist to start the flow.</p>
        <div className="now-queue">
          <h3>Queue</h3>
          <ol aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <li key={i} className="now-skeleton">
                <span />
                <span>
                  <i />
                  <i />
                </span>
              </li>
            ))}
          </ol>
        </div>
      </aside>
    )
  }

  const coming = [
    ...p.upNext.manual.map((t, k) => ({ t, key: `q${k}-${t.id}`, play: () => p.playFromQueue(k), queued: true })),
    ...p.upNext.fromList.map(({ track: t, index }) => ({ t, key: `l${index}-${t.id}`, play: () => p.jumpTo(index) })),
  ].slice(0, 20)

  return (
    <aside className="now-panel" aria-label="Now playing">
      <button type="button" className="now-cover" onClick={() => p.setExpanded(true)} title="Open full screen" aria-label="Open full screen player">
        <Cover src={track.coverUrl} seed={track.id} title={track.title} label res={560} eager />
        <span className="now-cover-hover">
          <Maximize2 />
        </span>
      </button>

      <div className="now-head">
        <div className="now-text">
          <h2 className="now-title" title={track.title}>
            {track.title}
          </h2>
          <ArtistLinks track={track} className="now-artist" />
        </div>
        <LikeButton track={track} size={20} className="now-like" />
      </div>
      {track.isPreview && (
        <p className="now-preview">
          <PreviewBadge /> 30-second preview
        </p>
      )}

      <SeekBar />
      <TransportControls />
      <VolumeControl />

      <div className="now-queue">
        <div className="now-queue-head">
          <h3>Queue</h3>
          {p.context?.label && <span className="now-queue-from">from {p.context.label}</span>}
        </div>
        {coming.length ? (
          <ol>
            {coming.map(({ t, key, play, queued }) => (
              <li key={key}>
                <button type="button" className="now-queue-item" onClick={play}>
                  <Cover src={t.coverUrl} seed={t.id} size={40} />
                  <span className="now-queue-text">
                    <strong>{t.title}</strong>
                    <small>
                      {queued ? 'Queued · ' : ''}
                      {t.byline}
                    </small>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <p className="now-queue-empty">
            <Equalizer playing={p.isPlaying} /> That’s the end of the queue.
          </p>
        )}
      </div>
    </aside>
  )
}
