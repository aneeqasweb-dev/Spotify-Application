import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Search, SearchX, X } from 'lucide-react'
import AlbumArt, { LikedArt } from '../components/music/AlbumArt'
import { AlbumCard, ArtistCard, PlaylistCard } from '../components/music/Cards'
import Cover from '../components/music/Cover'
import TrackList from '../components/music/TrackList'
import Avatar from '../components/ui/Avatar'
import EmptyState, { ErrorState } from '../components/ui/EmptyState'
import PageWash from '../components/ui/PageWash'
import PlayButton from '../components/ui/PlayButton'
import Section from '../components/ui/Section'
import { RowSkeletons } from '../components/ui/Skeletons'
import { useCollection } from '../context/CollectionContext'
import { useLibrary } from '../context/LibraryContext'
import { usePlayer } from '../context/PlayerContext'
import { hashString } from '../utils/cover'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'songs', label: 'Songs' },
  { id: 'artists', label: 'Artists' },
  { id: 'albums', label: 'Albums' },
  { id: 'playlists', label: 'Playlists' },
]

// Bold colours for the "Browse all" tiles (picked per genre, always the same)
const TILE_COLORS = ['#2d46b9', '#c2185b', '#1b7f4a', '#7e57c2', '#00838f', '#ad1457', '#3949ab', '#00897b', '#6a1b9a', '#1565c0', '#2e7d32', '#5e35b1']

export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const urlQ = params.get('q') ?? ''
  // The input keeps its own state so fast typing never drops letters.
  // The URL (?q=) follows along so searches can be shared / reloaded.
  const [q, setQ] = useState(urlQ)
  // Which search box changed the URL ('page' = this one, 'topbar' = the one at the top)
  const typedIn = location.state?.typedIn
  const [filter, setFilter] = useState('all')
  const { tracks, albums, artists, status, error, refresh } = useLibrary()
  const { playlists } = useCollection()

  // Sync from the URL unless this box made the change (top bar typing, links, back button all count)
  useEffect(() => {
    if (typedIn !== 'page') setQ(urlQ)
  }, [urlQ, typedIn])

  const onType = (value) => {
    setQ(value)
    setParams(value ? { q: value } : {}, { replace: true, state: { typedIn: 'page' } })
  }

  const term = q.trim().toLowerCase()
  const results = useMemo(() => {
    if (!term) return null
    const has = (s) => s.toLowerCase().includes(term)
    return {
      songs: tracks.filter((t) => has(t.title) || has(t.byline) || has(t.genre)),
      artists: artists.filter((a) => has(a.name)),
      albums: albums.filter((a) => has(a.title) || has(a.byline)),
      playlists: playlists.filter((p) => has(p.name) || has(p.description)),
    }
  }, [term, tracks, artists, albums, playlists])

  const total = results ? Object.values(results).reduce((n, list) => n + list.length, 0) : 0

  return (
    <>
      <PageWash color="#8b5cf6" />
      <div className="search-box">
        <Search className="search-icon" />
        <input
          className="search-input"
          type="search"
          value={q}
          onChange={(e) => onType(e.target.value)}
          placeholder="What do you want to listen to?"
          aria-label="Search songs, artists, albums and playlists"
          autoFocus
        />
        {q && (
          <button type="button" className="search-clear" onClick={() => onType('')} aria-label="Clear search">
            <X />
          </button>
        )}
      </div>

      {status === 'loading' && <RowSkeletons />}
      {status === 'error' && <ErrorState message={error} onRetry={refresh} />}
      {status === 'ready' && !results && <Browse />}

      {status === 'ready' && results && (
        <>
          <div className="chips" role="tablist" aria-label="Filter results">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filter === f.id}
                className={`chip${filter === f.id ? ' is-active' : ''}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {total === 0 ? (
            <EmptyState icon={SearchX} title={`No results found for “${q.trim()}”`}>
              Please make sure your words are spelled correctly, or use fewer or different keywords.
            </EmptyState>
          ) : (
            <Results results={results} filter={filter} term={term} />
          )}
        </>
      )}
    </>
  )
}

function Results({ results, filter, term }) {
  const ctx = { id: `search:${term}`, label: `Search “${term}”` }
  const grid = (items, render) =>
    items.length ? <div className="card-grid">{items.map(render)}</div> : <p className="muted">Nothing found.</p>

  if (filter === 'songs') {
    return results.songs.length ? <TrackList tracks={results.songs} context={ctx} /> : <p className="muted">No songs found.</p>
  }
  if (filter === 'artists') return grid(results.artists, (a) => <ArtistCard key={a.slug} artist={a} />)
  if (filter === 'albums') return grid(results.albums, (a) => <AlbumCard key={a.id} album={a} />)
  if (filter === 'playlists') return grid(results.playlists, (p) => <PlaylistCard key={p.id} playlist={p} />)

  return (
    <>
      <div className="search-top">
        <Section title="Top result">
          <TopResult results={results} term={term} />
        </Section>
        {results.songs.length > 0 && (
          <Section title="Songs">
            <TrackList tracks={results.songs.slice(0, 4)} context={ctx} showAlbum={false} />
          </Section>
        )}
      </div>
      {results.artists.length > 0 && (
        <Section title="Artists">
          <div className="shelf">
            {results.artists.map((a) => (
              <ArtistCard key={a.slug} artist={a} />
            ))}
          </div>
        </Section>
      )}
      {results.albums.length > 0 && (
        <Section title="Albums">
          <div className="shelf">
            {results.albums.map((a) => (
              <AlbumCard key={a.id} album={a} />
            ))}
          </div>
        </Section>
      )}
      {results.playlists.length > 0 && (
        <Section title="Playlists">
          <div className="shelf">
            {results.playlists.map((p) => (
              <PlaylistCard key={p.id} playlist={p} />
            ))}
          </div>
        </Section>
      )}
    </>
  )
}

function TopResult({ results, term }) {
  const navigate = useNavigate()
  const { context, currentId, isPlaying, playTracks, togglePlay } = usePlayer()

  // Prefer an exact-ish artist, then a song, then an album, then a playlist
  const artist = results.artists.find((a) => a.name.toLowerCase().startsWith(term))
  const song = !artist && results.songs[0]
  const album = !artist && !song && results.albums[0]
  const playlist = !artist && !song && !album && results.playlists[0]

  let card
  if (artist) {
    const id = `artist:${artist.slug}`
    const isThis = context?.id === id
    card = {
      art: artist.coverUrl ? (
        <Cover src={artist.coverUrl} seed={artist.slug} round className="top-result-cover top-result-avatar" res={240} />
      ) : (
        <Avatar name={artist.name} seed={artist.slug} size="xl" className="top-result-avatar" />
      ),
      title: artist.name,
      kind: 'Artist',
      sub: '',
      active: isThis && isPlaying,
      onPlay: () => (isThis ? togglePlay() : playTracks(artist.tracks, 0, { id, label: artist.name })),
      onOpen: () => navigate(`/artist/${artist.slug}`),
    }
  } else if (song) {
    const isThis = currentId === song.id
    card = {
      art: <Cover src={song.coverUrl} seed={song.id} title={song.title} className="top-result-cover" res={240} />,
      title: song.title,
      kind: 'Song',
      sub: song.byline,
      active: isThis && isPlaying,
      onPlay: () => (isThis ? togglePlay() : playTracks(results.songs, 0, { id: `search:${term}`, label: `Search “${term}”` })),
      onOpen: null,
    }
  } else {
    const item = album || playlist
    const isThis = context?.id === item.id
    card = {
      art: <AlbumArt album={item} className="top-result-cover" res={240} placeholder />,
      title: item.title ?? item.name,
      kind: album ? 'Album' : 'Playlist',
      sub: album ? album.byline : playlist.madeBy,
      active: isThis && isPlaying,
      onPlay: () => (isThis ? togglePlay() : playTracks(item.tracks, 0, { id: item.id, label: item.title ?? item.name })),
      onOpen: () => navigate(album ? `/album/${item.id}` : `/playlist/${item.id}`),
    }
  }

  return (
    <div className="top-result" onClick={card.onOpen ?? card.onPlay}>
      {card.art}
      <h3>{card.title}</h3>
      <p>
        {card.sub && <span>{card.sub}</span>}
        <span className="kind-pill">{card.kind}</span>
      </p>
      <PlayButton playing={card.active} onClick={card.onPlay} size="lg" className="top-result-play" label={card.title} />
    </div>
  )
}

// Before typing: genre tiles, like "Browse all" in a streaming app
function Browse() {
  const { tracks, genres } = useLibrary()

  if (!tracks.length) {
    return (
      <EmptyState icon={Search} title="Nothing to search yet">
        Once artists upload music, you’ll be able to find every song, album and artist here.
      </EmptyState>
    )
  }

  return (
    <>
      <Section title="Browse all">
        <div className="browse-grid">
          {genres.map((g) => {
            const cover = g.tracks.find((t) => t.coverUrl)
            return (
              <Link key={g.slug} to={`/genre/${g.slug}`} className="browse-tile" style={{ '--ta': TILE_COLORS[hashString(g.slug) % TILE_COLORS.length] }}>
                <span className="browse-title">{g.name}</span>
                <Cover src={cover?.coverUrl} seed={g.slug} title={g.name} className="browse-cover" res={240} />
              </Link>
            )
          })}
          <Link to="/collection/tracks" className="browse-tile" style={{ '--ta': '#4338ca' }}>
            <span className="browse-title">Liked Songs</span>
            <LikedArt className="browse-cover" />
          </Link>
          <Link to="/library?view=songs" className="browse-tile" style={{ '--ta': '#0f766e' }}>
            <span className="browse-title">All songs</span>
            <AlbumArt album={{ id: 'all-songs', title: 'All songs', coverUrl: '', tracks }} className="browse-cover" />
          </Link>
        </div>
      </Section>
    </>
  )
}
