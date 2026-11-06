import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { AudioLines, House, LibraryBig, Plus, Search } from 'lucide-react'
import { getErrorMessage } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useCollection } from '../../context/CollectionContext'
import { useLibrary } from '../../context/LibraryContext'
import { usePlayer } from '../../context/PlayerContext'
import { useToast } from '../../context/ToastContext'
import { plural } from '../../utils/format'
import AlbumArt, { LikedArt } from '../music/AlbumArt'
import Cover from '../music/Cover'
import Avatar from '../ui/Avatar'
import Equalizer from '../ui/Equalizer'
import { Logo } from '../ui/Logo'

const FILTERS = [
  { id: 'playlists', label: 'Playlists' },
  { id: 'albums', label: 'Albums' },
  { id: 'artists', label: 'Artists' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const toast = useToast()
  const { isArtist } = useAuth()
  const { albums, artists } = useLibrary()
  const { likedTracks, playlists, createPlaylist } = useCollection()
  const { context, isPlaying } = usePlayer()
  const [filter, setFilter] = useState(null) // null = everything

  const show = (kind) => !filter || filter === kind
  const playingId = isPlaying ? context?.id : null

  const newPlaylist = async () => {
    try {
      const playlist = await createPlaylist()
      toast.success(`Created ${playlist.name}`)
      navigate(`/playlist/${playlist.id}`)
    } catch (e) {
      toast.error(getErrorMessage(e, 'Couldn’t create a playlist.'))
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <Link to="/" className="sidebar-logo" aria-label="Beat Flow home">
          <Logo size={32} />
        </Link>
        <nav className="sidebar-nav" aria-label="Main">
          <NavLink to="/" end>
            <House /> Home
          </NavLink>
          <NavLink to="/search">
            <Search /> Search
          </NavLink>
          {isArtist && (
            <NavLink to="/studio">
              <AudioLines /> Artist Studio
            </NavLink>
          )}
        </nav>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-head">
          <Link to="/library" className="sidebar-library-link">
            <LibraryBig /> Your Library
          </Link>
          <button type="button" className="icon-btn" onClick={newPlaylist} title="Create playlist" aria-label="Create playlist">
            <Plus />
          </button>
        </div>

        <div className="sidebar-chips" role="tablist" aria-label="Filter your library">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              className={`chip chip-sm${filter === f.id ? ' is-active' : ''}`}
              onClick={() => setFilter((cur) => (cur === f.id ? null : f.id))}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="sidebar-list">
          {show('playlists') && (
            <NavLink to="/collection/tracks" className="sidebar-item">
              <LikedArt size={48} />
              <span className="sidebar-item-text">
                <span>Liked Songs</span>
                <small>Playlist · {plural(likedTracks.length, 'song')}</small>
              </span>
              {playingId === 'liked' && <Equalizer />}
            </NavLink>
          )}

          {show('playlists') &&
            playlists.map((p) => (
              <NavLink key={p.id} to={`/playlist/${p.id}`} className="sidebar-item">
                <AlbumArt album={p} size={48} placeholder />
                <span className="sidebar-item-text">
                  <span>{p.name}</span>
                  <small>Playlist · {p.madeBy}</small>
                </span>
                {playingId === p.id && <Equalizer />}
              </NavLink>
            ))}

          {show('albums') &&
            albums.map((album) => (
              <NavLink key={album.id} to={`/album/${album.id}`} className="sidebar-item">
                <AlbumArt album={album} size={48} label={false} />
                <span className="sidebar-item-text">
                  <span>{album.title}</span>
                  <small>Album · {album.byline}</small>
                </span>
                {playingId === album.id && <Equalizer />}
              </NavLink>
            ))}

          {show('artists') &&
            artists.map((artist) => (
              <NavLink key={artist.slug} to={`/artist/${artist.slug}`} className="sidebar-item">
                {artist.coverUrl ? (
                  <Cover src={artist.coverUrl} seed={artist.slug} size={48} round />
                ) : (
                  <Avatar name={artist.name} seed={artist.slug} size="lg" />
                )}
                <span className="sidebar-item-text">
                  <span>{artist.name}</span>
                  <small>Artist</small>
                </span>
                {playingId === `artist:${artist.slug}` && <Equalizer />}
              </NavLink>
            ))}
        </div>
      </div>
    </aside>
  )
}
