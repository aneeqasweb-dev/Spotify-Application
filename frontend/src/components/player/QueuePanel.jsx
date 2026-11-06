import { ListMusic, X } from 'lucide-react'
import { usePlayer } from '../../context/PlayerContext'
import Cover from '../music/Cover'
import Equalizer from '../ui/Equalizer'

function QueueItem({ track, active, playing, onPlay, onRemove }) {
  return (
    <li className={`queue-item${active ? ' is-current' : ''}`}>
      <button type="button" className="queue-item-main" onClick={onPlay} disabled={!onPlay}>
        <Cover src={track.coverUrl} seed={track.id} size={44} />
        <span className="queue-item-text">
          <strong>{track.title}</strong>
          <small>{track.byline}</small>
        </span>
        {active && playing && <Equalizer />}
      </button>
      {onRemove && (
        <button type="button" className="icon-btn" onClick={onRemove} aria-label={`Remove ${track.title} from queue`} title="Remove">
          <X />
        </button>
      )}
    </li>
  )
}

// Side panel: what's playing, songs you queued, then the rest of the album/playlist
export default function QueuePanel() {
  const { current, isPlaying, upNext, context, shuffle, jumpTo, playFromQueue, removeFromQueue, clearQueue, setQueueOpen } =
    usePlayer()

  return (
    <aside className="queue-panel" aria-label="Queue">
      <header className="queue-head">
        <h2>Queue</h2>
        <button type="button" className="icon-btn" onClick={() => setQueueOpen(false)} aria-label="Close queue">
          <X />
        </button>
      </header>

      <div className="queue-scroll">
        {!current ? (
          <div className="queue-empty">
            <ListMusic />
            <strong>Your queue is empty</strong>
            <span>Use “Add to queue” on any song to line it up next.</span>
          </div>
        ) : (
          <>
            <section className="queue-section">
              <h3>Now playing</h3>
              <ol>
                <QueueItem track={current} active playing={isPlaying} />
              </ol>
            </section>

            {upNext.manual.length > 0 && (
              <section className="queue-section">
                <div className="queue-section-head">
                  <h3>Next in queue</h3>
                  <button type="button" className="link-btn" onClick={clearQueue}>
                    Clear queue
                  </button>
                </div>
                <ol>
                  {upNext.manual.map((t, k) => (
                    <QueueItem key={`${t.id}-${k}`} track={t} onPlay={() => playFromQueue(k)} onRemove={() => removeFromQueue(k)} />
                  ))}
                </ol>
              </section>
            )}

            {upNext.fromList.length > 0 && (
              <section className="queue-section">
                <h3>
                  Next from: {context?.label ?? 'Beat Flow'}
                  {shuffle && <span className="queue-note"> · shuffle on</span>}
                </h3>
                <ol>
                  {upNext.fromList.slice(0, 50).map(({ track, index }) => (
                    <QueueItem key={`${track.id}-${index}`} track={track} onPlay={() => jumpTo(index)} />
                  ))}
                </ol>
              </section>
            )}
          </>
        )}
      </div>
    </aside>
  )
}
