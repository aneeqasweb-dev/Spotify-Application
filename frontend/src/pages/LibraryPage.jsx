import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Shuffle } from 'lucide-react'
import { getErrorMessage } from '../api/client'
import { AlbumCard, ArtistCard, LikedSongsCard, PlaylistCard } from '../components/music/Cards'
import TrackList from '../components/music/TrackList'
import { ErrorState } from '../components/ui/EmptyState'
import PageWash from '../components/ui/PageWash'
import PlayButton from '../components/ui/PlayButton'
import { RowSkeletons } from '../components/ui/Skeletons'
import { useCollection } from '../context/CollectionContext'
import { useLibrary } from '../context/LibraryContext'
import { usePlayer } from '../context/PlayerContext'
import { useToast } from '../context/ToastContext'
import { plural } from '../utils/format'

const VIEWS = [
  { id: 'all', label: 'All' },
  { id: 'playlists', label: 'Playlists' },
  { id: 'albums', label: 'Albums' },
  { id: 'artists', label: 'Artists' },
  { id: 'songs', label: 'Songs' },
]
const ALL_SONGS = { id: 'library', label: 'All songs' }

export default function LibraryPage() {
  const [params, setParams] = useSearchParams()
  const view = VIEWS.some((v) => v.id === params.get('view')) ? params.get('view') : 'all'
  const navigate = useNavigate()
  const toast = useToast()
  const { tracks, albums, artists, status, error, refresh } = useLibrary()
  const { likedTracks, playlists, createPlaylist } = useCollection()
  const { context, isPlaying, playTracks, togglePlay, shufflePlay } = usePlayer()
  const show = (kind) => view === 'all' || view === kind

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
    <>
      <PageWash color="#7c3aed" />
      <header className="page-header">
        <h1 className="page-title">Your Library</h1>
        <p className="lede">
          {plural(playlists.length + 1, 'playlist')} · {plural(albums.length, 'album')} · {plural(artists.length, 'artist')} ·{' '}
          {plural(tracks.length, 'song')}
        </p>
      </header>

      <div className="chips" role="tablist" aria-label="Library sections">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={view === v.id}
            className={`chip${view === v.id ? ' is-active' : ''}`}
            onClick={() => setParams(v.id === 'all' ? {} : { view: v.id }, { replace: true })}
          >
            {v.label}
          </button>
        ))}
      </div>

      {status === 'loading' && <RowSkeletons count={8} />}
      {status === 'error' && <ErrorState message={error} onRetry={refresh} />}

      {status === 'ready' && view === 'songs' && (
        <>
          <div className="action-row">
            <PlayButton
              size="lg"
              playing={context?.id === ALL_SONGS.id && isPlaying}
              onClick={() => (context?.id === ALL_SONGS.id ? togglePlay() : playTracks(tracks, 0, ALL_SONGS))}
              label="all songs"
            />
            <button type="button" className="icon-btn icon-btn-lg" onClick={() => shufflePlay(tracks, ALL_SONGS)} aria-label="Shuffle all songs" title="Shuffle">
              <Shuffle />
            </button>
          </div>
          <TrackList tracks={tracks} context={ALL_SONGS} showAdded />
        </>
      )}

      {status === 'ready' && view !== 'songs' && (
        <div className="card-grid">
          {show('playlists') && (
            <button type="button" className="card card-create" onClick={newPlaylist}>
              <span className="card-art create-art">
                <Plus />
              </span>
              <h3 className="card-title">Create playlist</h3>
              <p className="card-sub">It’s easy, we’ll help you</p>
            </button>
          )}
          {show('playlists') && <LikedSongsCard tracks={likedTracks} />}
          {show('playlists') && playlists.map((p) => <PlaylistCard key={p.id} playlist={p} />)}
          {show('albums') && albums.map((a) => <AlbumCard key={a.id} album={a} />)}
          {show('artists') && artists.map((a) => <ArtistCard key={a.slug} artist={a} />)}
        </div>
      )}
    </>
  )
}
