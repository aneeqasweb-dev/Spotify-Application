import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ListMusic, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { getErrorMessage, playlistApi } from '../api/client'
import AlbumArt, { albumCoverSrc } from '../components/music/AlbumArt'
import CollectionHeader, { ActionBar } from '../components/music/CollectionHeader'
import Cover from '../components/music/Cover'
import EditDetailsModal from '../components/music/EditDetailsModal'
import TrackList, { ArtistLinks } from '../components/music/TrackList'
import EmptyState, { ErrorState } from '../components/ui/EmptyState'
import { ConfirmModal } from '../components/ui/Modal'
import PageWash from '../components/ui/PageWash'
import { RowSkeletons } from '../components/ui/Skeletons'
import { useAuth } from '../context/AuthContext'
import { useCollection } from '../context/CollectionContext'
import { useLibrary } from '../context/LibraryContext'
import { usePlayer } from '../context/PlayerContext'
import { useToast } from '../context/ToastContext'
import { useDominantColor } from '../hooks/useDominantColor'
import { coverArt } from '../utils/cover'
import { plural, totalLength } from '../utils/format'

export default function PlaylistPage() {
  const { playlistId } = useParams()
  const { playlists } = useCollection()
  const [fetched, setFetched] = useState({ id: null, playlist: null, status: 'loading', error: '' })

  // Your own / editorial playlists are already loaded; others are fetched (e.g. a shared link)
  const known = playlists.find((p) => p.id === playlistId)
  useEffect(() => {
    if (known) return undefined
    let alive = true
    playlistApi
      .get(playlistId)
      .then((playlist) => alive && setFetched({ id: playlistId, playlist, status: 'ready', error: '' }))
      .catch((err) =>
        alive &&
        setFetched({ id: playlistId, playlist: null, status: err.response?.status === 404 ? 'notfound' : 'error', error: getErrorMessage(err) }),
      )
    return () => {
      alive = false
    }
  }, [playlistId, known])

  const state = fetched.id === playlistId ? fetched : { status: 'loading' }
  const playlist = known ?? state.playlist

  if (!playlist) {
    if (state.status === 'notfound') {
      return (
        <EmptyState icon={ListMusic} title="Playlist not found" action={<Link to="/library" className="btn btn-ghost">Your Library</Link>}>
          It may have been deleted by its owner.
        </EmptyState>
      )
    }
    if (state.status === 'error') return <ErrorState message={state.error} />
    return <RowSkeletons count={6} />
  }

  return <PlaylistView playlist={playlist} />
}

function PlaylistView({ playlist }) {
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const { updatePlaylist, deletePlaylist } = useCollection()
  const { context, isPlaying, playTracks, togglePlay, shufflePlay } = usePlayer()
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isOwner = playlist.owner.id === user.id
  const ctx = { id: playlist.id, label: playlist.name }
  const isThis = context?.id === playlist.id
  const wash = useDominantColor(albumCoverSrc(playlist), coverArt(playlist.id).colors[0])
  const length = totalLength(playlist.tracks)

  const remove = async () => {
    setDeleting(true)
    try {
      await deletePlaylist(playlist.id)
      toast.success(`Deleted ${playlist.name}`)
      navigate('/library')
    } catch (e) {
      toast.error(getErrorMessage(e, 'Couldn’t delete the playlist.'))
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <>
      <PageWash color={wash} strong />
      <CollectionHeader
        art={<AlbumArt album={playlist} placeholder res={560} eager />}
        eyebrow={playlist.curator ? 'Playlist · Beat Flow pick' : 'Playlist'}
        title={playlist.name}
        description={playlist.description}
        onEdit={isOwner ? () => setEditing(true) : undefined}
        meta={
          <span>
            <strong>{playlist.madeBy}</strong> · {plural(playlist.tracks.length, 'song')}
            {length && <span className="muted">, {length}</span>}
          </span>
        }
      />

      <ActionBar
        label={playlist.name}
        disabled={!playlist.tracks.length}
        playing={isThis && isPlaying}
        onPlay={() => (isThis ? togglePlay() : playTracks(playlist.tracks, 0, ctx))}
        onShuffle={() => shufflePlay(playlist.tracks, ctx)}
      >
        {isOwner && (
          <>
            <button type="button" className="icon-btn icon-btn-lg" onClick={() => setEditing(true)} title="Edit details" aria-label="Edit details">
              <Pencil />
            </button>
            <button type="button" className="icon-btn icon-btn-lg" onClick={() => setConfirming(true)} title="Delete playlist" aria-label="Delete playlist">
              <Trash2 />
            </button>
          </>
        )}
      </ActionBar>

      {playlist.tracks.length > 0 && <TrackList tracks={playlist.tracks} context={ctx} playlist={playlist} />}

      {isOwner && <FindSongs playlist={playlist} />}

      {!isOwner && playlist.tracks.length === 0 && (
        <EmptyState icon={ListMusic} title="This playlist is empty">
          Check back later.
        </EmptyState>
      )}

      {editing && (
        <EditDetailsModal
          item={playlist}
          onSave={(data) => updatePlaylist(playlist.id, data).then(() => toast.success('Playlist updated'))}
          onClose={() => setEditing(false)}
        />
      )}
      {confirming && (
        <ConfirmModal title="Delete from Your Library?" busy={deleting} onConfirm={remove} onClose={() => setConfirming(false)}>
          This will delete <strong>{playlist.name}</strong> from Your Library.
        </ConfirmModal>
      )}
    </>
  )
}

// "Let's find something for your playlist" — search the catalogue and add songs in one click
function FindSongs({ playlist }) {
  const { tracks } = useLibrary()
  const { addToPlaylist } = useCollection()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(playlist.tracks.length === 0)

  const inPlaylist = useMemo(() => new Set(playlist.tracks.map((t) => t.id)), [playlist.tracks])
  const results = useMemo(() => {
    const available = tracks.filter((t) => !inPlaylist.has(t.id))
    const term = query.trim().toLowerCase()
    if (term) {
      return available.filter((t) => t.title.toLowerCase().includes(term) || t.byline.toLowerCase().includes(term)).slice(0, 12)
    }
    // No search yet: suggest songs from the same genres, then popular ones
    const genres = new Set(playlist.tracks.map((t) => t.genre).filter(Boolean))
    return [...available].sort((a, b) => (genres.has(b.genre) - genres.has(a.genre)) || b.plays - a.plays).slice(0, 10)
  }, [tracks, inPlaylist, query, playlist.tracks])

  if (!open) {
    return (
      <div className="find-more">
        <button type="button" className="link-btn" onClick={() => setOpen(true)}>
          Find more
        </button>
      </div>
    )
  }

  return (
    <section className="find-songs">
      <div className="find-head">
        <div>
          <h2>Let’s find something for your playlist</h2>
          {!query && <p>{playlist.tracks.length ? 'Recommended, based on what’s in this playlist' : 'Popular songs to get you started'}</p>}
        </div>
        {playlist.tracks.length > 0 && (
          <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close">
            <X />
          </button>
        )}
      </div>
      <div className="find-search">
        <Search />
        <input
          className="find-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for songs or artists"
          aria-label="Search for songs to add"
        />
        {query && (
          <button type="button" className="icon-btn" onClick={() => setQuery('')} aria-label="Clear search">
            <X />
          </button>
        )}
      </div>
      {results.length ? (
        <ul className="find-list">
          {results.map((t) => (
            <li key={t.id} className="find-row">
              <Cover src={t.coverUrl} seed={t.id} size={40} />
              <div className="find-text">
                <strong>{t.title}</strong>
                <ArtistLinks track={t} className="find-artist" />
              </div>
              <span className="find-genre">{t.genre}</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => addToPlaylist(playlist, t)}>
                <Plus /> Add
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted find-none">{query ? `No songs match “${query}”.` : 'Every song is already in this playlist.'}</p>
      )}
    </section>
  )
}
