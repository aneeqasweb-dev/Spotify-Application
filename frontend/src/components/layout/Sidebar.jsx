import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { AudioLines, Heart, House, LibraryBig, Plus, Search } from 'lucide-react'
import { getErrorMessage } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useCollection } from '../../context/CollectionContext'
import { useLibrary } from '../../context/LibraryContext'
import { usePlayer } from '../../context/PlayerContext'
import { useToast } from '../../context/ToastContext'
import AlbumArt from '../music/AlbumArt'
import Cover from '../music/Cover'
import Avatar from '../ui/Avatar'
import Equalizer from '../ui/Equalizer'
import { Logo } from '../ui/Logo'
import UserMenu from './UserMenu'

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
  const [filter, setFilter] = useState('playlists')
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
      <Link to="/" className="sidebar-logo" aria-label="Beat Flow home">
        <Logo size={44} />
      </Link>

      <nav className="sidebar-nav" aria-label="Main">
        <NavLink to="/" end>
          <House /> Home
        </NavLink>
        <NavLink to="/search">
          <Search /> Search
        </NavLink>
        <NavLink to="/library">
          <LibraryBig /> Your Library
        </NavLink>
        {isArtist && (
          <NavLink to="/studio">
            <AudioLines /> Artist Studio
          </NavLink>
        )}
      </nav>

      <div className="sidebar-sep" />

      <div className="sidebar-actions">
        <button type="button" className="sidebar-action" onClick={newPlaylist}>
          <span className="sidebar-action-icon is-plus">
            <Plus />
          </span>
          Create Playlist
        </button>
        <NavLink to="/collection/tracks" className="sidebar-action">
          <span className="sidebar-action-icon is-heart">
            <Heart fill="currentColor" />
          </span>
          Liked Songs
          {likedTracks.length > 0 && <span className="sidebar-count">{likedTracks.length}</span>}
        </NavLink>
      </div>

      <div className="sidebar-library">
        <div className="sidebar-chips" role="tablist" aria-label="Your library">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              className={`chip chip-sm${filter === f.id ? ' is-active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="sidebar-list">
          {filter === 'playlists' &&
            playlists.map((p) => (
              <NavLink key={p.id} to={`/playlist/${p.id}`} className="sidebar-item">
                <AlbumArt album={p} size={40} placeholder />
                <span className="sidebar-item-text">
                  <span>{p.name}</span>
                  <small>Playlist · {p.madeBy}</small>
                </span>
                {playingId === p.id && <Equalizer />}
              </NavLink>
            ))}
          {filter === 'albums' &&
            albums.map((album) => (
              <NavLink key={album.id} to={`/album/${album.id}`} className="sidebar-item">
                <AlbumArt album={album} size={40} label={false} />
                <span className="sidebar-item-text">
                  <span>{album.title}</span>
                  <small>Album · {album.byline}</small>
                </span>
                {playingId === album.id && <Equalizer />}
              </NavLink>
            ))}
          {filter === 'artists' &&
            artists.map((artist) => (
              <NavLink key={artist.slug} to={`/artist/${artist.slug}`} className="sidebar-item">
                {artist.coverUrl ? (
                  <Cover src={artist.coverUrl} seed={artist.slug} size={40} round />
                ) : (
                  <Avatar name={artist.name} seed={artist.slug} size="md" />
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

      <div className="sidebar-user">
        <UserMenu variant="chip" placement="up" />
      </div>
    </aside>
  )
}
