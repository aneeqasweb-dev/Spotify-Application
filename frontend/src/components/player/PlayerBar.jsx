import { ChevronUp, ListMusic, Maximize2, Music2 } from 'lucide-react'
import { usePlayer, usePlayerProgress } from '../../context/PlayerContext'
import Cover from '../music/Cover'
import { ArtistLinks } from '../music/TrackList'
import LikeButton from '../ui/LikeButton'
import PreviewBadge from '../ui/PreviewBadge'
import { MainPlayIcon, SeekBar, TransportControls, VolumeControl } from './PlayerControls'

export default function PlayerBar() {
  const p = usePlayer()
  const { currentTime, duration } = usePlayerProgress()
  const track = p.current
  const pct = duration ? (currentTime / duration) * 100 : 0

  return (
    <footer className={`player${track ? '' : ' is-empty'}`}>
      <div className="player-track">
        {track ? (
          <button
            type="button"
            className="player-cover"
            onClick={() => p.setExpanded(true)}
            aria-label="Open full screen player"
            title="Full screen"
          >
            <Cover src={track.coverUrl} seed={track.id} size={56} eager />
            <span className="player-cover-hover">
              <ChevronUp />
            </span>
          </button>
        ) : (
          <span className="player-cover-empty">
            <Music2 />
          </span>
        )}
        <button
          type="button"
          className="player-meta"
          onClick={() => track && p.setExpanded(true)}
          disabled={!track}
          aria-label={track ? `Now playing: ${track.title}. Open full screen player` : 'Nothing playing'}
        >
          <span className="player-title">
            {track?.title ?? 'Nothing playing'}
            {track?.isPreview && <PreviewBadge />}
          </span>
          {track ? (
            <ArtistLinks track={track} className="player-artist" />
          ) : (
            <span className="player-artist">Pick a song to start the flow</span>
          )}
        </button>
        {track && <LikeButton track={track} className="player-like" />}
      </div>

      <div className="player-center">
        <TransportControls />
        <SeekBar />
      </div>

      <div className="player-extra">
        <button
          type="button"
          className={`ctrl${p.queueOpen ? ' is-active' : ''}`}
          onClick={p.toggleQueue}
          aria-pressed={p.queueOpen}
          aria-label="Queue"
          title="Queue"
        >
          <ListMusic />
        </button>
        <VolumeControl />
        <button
          type="button"
          className="ctrl"
          onClick={() => p.setExpanded(true)}
          disabled={!track}
          aria-label="Open full screen player"
          title="Full screen"
        >
          <Maximize2 />
        </button>
      </div>

      {/* Phone layout: heart + play button and a thin progress line */}
      <div className="player-mini">
        {track && <LikeButton track={track} size={20} />}
        <button
          type="button"
          className="ctrl-main"
          onClick={p.togglePlay}
          disabled={!track}
          aria-label={p.isPlaying ? 'Pause' : 'Play'}
        >
          <MainPlayIcon />
        </button>
      </div>
      <div className="player-mini-progress" style={{ '--p': `${pct}%` }} aria-hidden="true" />
    </footer>
  )
}
