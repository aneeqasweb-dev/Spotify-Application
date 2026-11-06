import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { Clock3, Ellipsis, Pause, Play } from 'lucide-react'
import { useCollection } from '../../context/CollectionContext'
import { useLibrary } from '../../context/LibraryContext'
import { usePlayer } from '../../context/PlayerContext'
import { useTrackDuration } from '../../hooks/useTrackDuration'
import { dateFromId, formatTime, timeAgo } from '../../utils/format'
import { useMenu } from '../menus/MenuContext'
import Equalizer from '../ui/Equalizer'
import LikeButton from '../ui/LikeButton'
import PreviewBadge from '../ui/PreviewBadge'
import Cover from './Cover'

// Artist names under a song title, each linking to the artist page
export function ArtistLinks({ track, className = '' }) {
  return (
    <span className={className}>
      {track.artists.map((a, i) => (
        <Fragment key={a.slug}>
          {i > 0 && ', '}
          <Link to={`/artist/${a.slug}`} onClick={(e) => e.stopPropagation()}>
            {a.name}
          </Link>
        </Fragment>
      ))}
    </span>
  )
}

/**
 * A table of songs, like the one on album and playlist pages.
 * - showAlbum / showAdded: optional columns
 * - showPlays: show play counts instead of the album (artist "Popular" list)
 * - playlist: when set, the menu offers "Remove from this playlist"
 */
export default function TrackList({ tracks, context, showAlbum = true, showAdded = false, showPlays = false, playlist }) {
  const { currentId, isPlaying, playTracks, togglePlay } = usePlayer()
  const { albumOfTrack } = useLibrary()
  const { isLiked } = useCollection()
  const { openTrackMenu } = useMenu()

  const middle = showPlays ? 'minmax(90px, 1fr)' : showAlbum ? 'minmax(0, 3fr)' : null
  const cols = ['36px', 'minmax(0, 4fr)', middle, showAdded && 'minmax(110px, 1.4fr)', '132px'].filter(Boolean).join(' ')

  return (
    <div className="tracklist" style={{ '--tl-cols': cols }}>
      <div className="tracklist-head" aria-hidden="true">
        <span className="tl-num">#</span>
        <span>Title</span>
        {showPlays ? <span className="tl-mid">Plays</span> : showAlbum && <span className="tl-mid">Album</span>}
        {showAdded && <span className="tl-added">Date added</span>}
        <span className="tl-end">
          <Clock3 size={16} />
        </span>
      </div>
      <ol className="tracklist-body">
        {tracks.map((track, i) => {
          const isCurrent = track.id === currentId
          return (
            <TrackRow
              key={`${track.id}-${i}`}
              track={track}
              position={i + 1}
              album={showAlbum && !showPlays ? albumOfTrack.get(track.id) : null}
              isCurrent={isCurrent}
              isPlaying={isCurrent && isPlaying}
              liked={isLiked(track.id)}
              showAlbum={showAlbum && !showPlays}
              showPlays={showPlays}
              showAdded={showAdded}
              onActivate={() => (isCurrent ? togglePlay() : playTracks(tracks, i, context))}
              onMenu={(e) => openTrackMenu(e, track, { playlist })}
            />
          )
        })}
      </ol>
    </div>
  )
}

function TrackRow({ track, position, album, isCurrent, isPlaying, liked, showAlbum, showPlays, showAdded, onActivate, onMenu }) {
  // Older songs may not have a saved length; read it from the file in that case
  const loaded = useTrackDuration(track.duration ? null : track.uri)
  const duration = track.duration ?? loaded

  return (
    <li
      className={`track-row${isCurrent ? ' is-current' : ''}${liked ? ' is-liked' : ''}`}
      onClick={onActivate}
      onContextMenu={onMenu}
    >
      <div className="tl-num">
        {isPlaying ? <Equalizer /> : <span className="tl-index">{position}</span>}
        <button
          type="button"
          className="tl-play"
          onClick={(e) => {
            e.stopPropagation()
            onActivate()
          }}
          aria-label={`${isPlaying ? 'Pause' : 'Play'} ${track.title}`}
        >
          {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
        </button>
      </div>
      <div className="tl-title">
        <Cover src={track.coverUrl} seed={track.id} size={40} />
        <div className="tl-text">
          <span className="tl-name">
            {track.title}
            {track.isPreview && <PreviewBadge />}
          </span>
          <ArtistLinks track={track} className="tl-artist" />
        </div>
      </div>
      {showPlays && <span className="tl-mid">{track.plays ? track.plays.toLocaleString() : '—'}</span>}
      {showAlbum && (
        <span className="tl-mid">
          {album ? (
            <Link to={`/album/${album.id}`} onClick={(e) => e.stopPropagation()}>
              {album.title}
            </Link>
          ) : (
            track.albumName || 'Single'
          )}
        </span>
      )}
      {showAdded && <span className="tl-added">{timeAgo(dateFromId(track.id))}</span>}
      <span className="tl-end">
        <LikeButton track={track} className="tl-like" />
        <span className="tl-dur">{duration ? formatTime(duration) : '—'}</span>
        <button type="button" className="tl-more" onClick={onMenu} aria-label={`More options for ${track.title}`} title="More options">
          <Ellipsis size={18} />
        </button>
      </span>
    </li>
  )
}
