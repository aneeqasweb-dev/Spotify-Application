import { Link } from 'react-router-dom'
import { usePlayer } from '../../context/PlayerContext'
import { dateFromId, plural } from '../../utils/format'
import { coverArt } from '../../utils/cover'
import Avatar from '../ui/Avatar'
import Equalizer from '../ui/Equalizer'
import PlayButton from '../ui/PlayButton'
import AlbumArt, { LikedArt } from './AlbumArt'
import Cover from './Cover'

// Plays a list as a "context" (album, playlist, mix…), or pauses it if it's the one playing
function useContextPlay(id, tracks, label) {
  const { context, isPlaying, playTracks, togglePlay } = usePlayer()
  const isThis = context?.id === id
  return {
    isThis,
    active: isThis && isPlaying,
    play: () => (isThis ? togglePlay() : playTracks(tracks, 0, { id, label })),
  }
}

export function TrackCard({ track, tracks, index, context }) {
  const { currentId, isPlaying, playTracks, togglePlay } = usePlayer()
  const isCurrent = currentId === track.id
  const active = isCurrent && isPlaying
  const handle = () => (isCurrent ? togglePlay() : playTracks(tracks, index, context))

  return (
    <div className={`card${isCurrent ? ' is-current' : ''}`} onClick={handle}>
      <div className="card-art">
        <Cover src={track.coverUrl} seed={track.id} title={track.title} />
        {active && <Equalizer className="card-eq" />}
        <PlayButton playing={active} onClick={handle} className="card-play" label={track.title} />
      </div>
      <h3 className="card-title" title={track.title}>
        {track.title}
      </h3>
      <p className="card-sub">{track.byline}</p>
    </div>
  )
}

export function AlbumCard({ album, sub }) {
  const { isThis, active, play } = useContextPlay(album.id, album.tracks, album.title)
  const year = dateFromId(album.id)?.getFullYear()

  return (
    <Link to={`/album/${album.id}`} className={`card${isThis ? ' is-current' : ''}`}>
      <div className="card-art">
        <AlbumArt album={album} />
        {album.tracks.length > 0 && (
          <PlayButton playing={active} onClick={play} className="card-play" label={album.title} tabIndex={-1} />
        )}
      </div>
      <h3 className="card-title" title={album.title}>
        {album.title}
      </h3>
      <p className="card-sub">{sub ?? `${year} · ${album.byline}`}</p>
    </Link>
  )
}

export function PlaylistCard({ playlist }) {
  const { isThis, active, play } = useContextPlay(playlist.id, playlist.tracks, playlist.name)

  return (
    <Link to={`/playlist/${playlist.id}`} className={`card${isThis ? ' is-current' : ''}`}>
      <div className="card-art">
        <AlbumArt album={playlist} placeholder />
        {playlist.tracks.length > 0 && (
          <PlayButton playing={active} onClick={play} className="card-play" label={playlist.name} tabIndex={-1} />
        )}
      </div>
      <h3 className="card-title" title={playlist.name}>
        {playlist.name}
      </h3>
      <p className="card-sub">{playlist.description || `By ${playlist.madeBy}`}</p>
    </Link>
  )
}

export function LikedSongsCard({ tracks }) {
  const { isThis, active, play } = useContextPlay('liked', tracks, 'Liked Songs')
  return (
    <Link to="/collection/tracks" className={`card${isThis ? ' is-current' : ''}`}>
      <div className="card-art">
        <LikedArt />
        {tracks.length > 0 && (
          <PlayButton playing={active} onClick={play} className="card-play" label="Liked Songs" tabIndex={-1} />
        )}
      </div>
      <h3 className="card-title">Liked Songs</h3>
      <p className="card-sub">Playlist · {plural(tracks.length, 'song')}</p>
    </Link>
  )
}

export function ArtistCard({ artist }) {
  const { active, play } = useContextPlay(`artist:${artist.slug}`, artist.tracks, artist.name)
  return (
    <Link to={`/artist/${artist.slug}`} className="card card-artist">
      <div className="card-art card-art-round">
        {artist.coverUrl ? (
          <Cover src={artist.coverUrl} seed={artist.slug} round />
        ) : (
          <Avatar name={artist.name} seed={artist.slug} size="xl" />
        )}
        <PlayButton playing={active} onClick={play} className="card-play" label={artist.name} tabIndex={-1} />
      </div>
      <h3 className="card-title">{artist.name}</h3>
      <p className="card-sub">Artist</p>
    </Link>
  )
}

// The artists with the most songs in a genre, and a cover picture from the top one
export function mixDetails(genre) {
  const counts = new Map()
  for (const t of genre.tracks) for (const a of t.artists) counts.set(a.name, (counts.get(a.name) || 0) + 1)
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name)
  const cover =
    genre.tracks.find((t) => t.coverUrl && t.isPreview && t.artists.some((a) => a.name === ranked[0])) ||
    genre.tracks.find((t) => t.coverUrl && t.artists.some((a) => a.name === ranked[0])) ||
    genre.tracks.find((t) => t.coverUrl)
  return { cover, names: ranked.slice(0, 3).join(', '), ranked }
}

// A "mix" made from one genre: a song cover with a coloured band and the mix name
export function MixCard({ genre, label = 'Mix' }) {
  const { isThis, active, play } = useContextPlay(`genre:${genre.slug}`, genre.tracks, `${genre.name} ${label}`)
  const { cover, names } = mixDetails(genre)
  const [color] = coverArt(genre.slug).colors

  return (
    <Link to={`/genre/${genre.slug}`} className={`card${isThis ? ' is-current' : ''}`}>
      <div className={`card-art mix-art${cover?.credits.includes('CC BY') ? ' is-designed' : ''}`} style={{ '--mix': color }}>
        <Cover src={cover?.coverUrl} seed={genre.slug} title={genre.name} />
        <span className="mix-band">
          <span className="mix-name">
            {genre.name} {label}
          </span>
        </span>
        <PlayButton playing={active} onClick={play} className="card-play" label={`${genre.name} ${label}`} tabIndex={-1} />
      </div>
      <h3 className="card-title">
        {genre.name} {label}
      </h3>
      <p className="card-sub">{names}</p>
    </Link>
  )
}
