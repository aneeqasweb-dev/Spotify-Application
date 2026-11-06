import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AudioLines } from 'lucide-react'
import AlbumArt, { albumCoverSrc, LikedArt } from '../components/music/AlbumArt'
import { AlbumCard, ArtistCard, MixCard, PlaylistCard, TrackCard } from '../components/music/Cards'
import Cover from '../components/music/Cover'
import TrackList from '../components/music/TrackList'
import EmptyState, { ErrorState } from '../components/ui/EmptyState'
import Equalizer from '../components/ui/Equalizer'
import PageWash from '../components/ui/PageWash'
import PlayButton from '../components/ui/PlayButton'
import Section from '../components/ui/Section'
import { CardSkeletons, QuickSkeletons } from '../components/ui/Skeletons'
import { useAuth } from '../context/AuthContext'
import { useCollection } from '../context/CollectionContext'
import { useLibrary } from '../context/LibraryContext'
import { usePlayer } from '../context/PlayerContext'
import { useDominantColor } from '../hooks/useDominantColor'
import { greeting } from '../utils/format'

const DEFAULT_WASH = '#1f4fbf'
const FRESH = { id: 'fresh', label: 'Fresh tracks' }

// Up to 8 shortcuts: Liked Songs, your playlists, editorial picks, albums, then songs
function buildQuickPicks({ likedTracks, playlists, albums, tracks }) {
  const items = []
  if (likedTracks.length) {
    items.push({ key: 'liked', id: 'liked', title: 'Liked Songs', to: '/collection/tracks', tracks: likedTracks, art: <LikedArt size={64} /> })
  }
  for (const p of playlists.filter((p) => p.tracks.length)) {
    items.push({ key: `p-${p.id}`, id: p.id, title: p.name, to: `/playlist/${p.id}`, tracks: p.tracks, src: albumCoverSrc(p), art: <AlbumArt album={p} size={64} placeholder /> })
  }
  for (const a of albums.filter((a) => a.tracks.length)) {
    items.push({ key: `a-${a.id}`, id: a.id, title: a.title, to: `/album/${a.id}`, tracks: a.tracks, src: albumCoverSrc(a), art: <AlbumArt album={a} size={64} label={false} /> })
  }
  tracks.forEach((t, index) => {
    items.push({ key: `t-${t.id}`, id: t.id, title: t.title, track: t, index, src: t.coverUrl, art: <Cover src={t.coverUrl} seed={t.id} size={64} /> })
  })
  return items.slice(0, 8)
}

export default function HomePage() {
  const { user, isArtist } = useAuth()
  const { tracks, albums, artists, genres, status, error, refresh } = useLibrary()
  const { likedTracks, playlists, recent } = useCollection()
  const [hoverSrc, setHoverSrc] = useState(null)

  const editorial = playlists.filter((p) => p.curator && p.tracks.length)
  const quick = useMemo(
    () => buildQuickPicks({ likedTracks, playlists, albums, tracks }),
    [likedTracks, playlists, albums, tracks],
  )
  const trending = useMemo(
    () => [...tracks].sort((a, b) => b.plays - a.plays).slice(0, 6),
    [tracks],
  )
  const mixes = genres.filter((g) => g.tracks.length >= 2).slice(0, 8)

  // The page glow takes the colour of the tile you hover (or the first pick)
  const wash = useDominantColor(hoverSrc ?? quick.find((q) => q.src)?.src, DEFAULT_WASH)
  const ready = status === 'ready'

  return (
    <>
      <PageWash color={wash} />

      <header className="hero">
        <h1 className="hero-title">
          {greeting()}, {user.username}
        </h1>
      </header>

      {status === 'loading' && (
        <>
          <QuickSkeletons />
          <CardSkeletons />
        </>
      )}

      {status === 'error' && <ErrorState message={error} onRetry={refresh} />}

      {ready && tracks.length === 0 && (
        <EmptyState
          icon={AudioLines}
          title={isArtist ? 'Your stage is set' : 'It’s quiet in here… for now'}
          action={
            isArtist && (
              <Link to="/studio" className="btn btn-primary">
                Upload your first song
              </Link>
            )
          }
        >
          {isArtist
            ? 'Nobody has uploaded music yet. Drop a song in the Studio — its cover picture is added automatically.'
            : 'No songs have been uploaded yet. As soon as artists start sharing, their music will flow right here.'}
        </EmptyState>
      )}

      {ready && tracks.length > 0 && (
        <>
          <div className="quick-grid">
            {quick.map((item) => (
              <QuickTile key={item.key} item={item} tracks={tracks} onHover={setHoverSrc} />
            ))}
          </div>

          {recent.length > 0 && (
            <Section title="Jump back in" subtitle="Songs you played recently">
              <div className="shelf">
                {recent.slice(0, 12).map((t, i) => (
                  <TrackCard key={t.id} track={t} tracks={recent} index={i} context={{ id: 'recent', label: 'Recently played' }} />
                ))}
              </div>
            </Section>
          )}

          {mixes.length > 0 && (
            <Section title={`Made for ${user.username}`} subtitle="Mixes of the sounds on Beat Flow">
              <div className="shelf">
                {mixes.map((g) => (
                  <MixCard key={g.slug} genre={g} />
                ))}
              </div>
            </Section>
          )}

          {editorial.length > 0 && (
            <Section title="Beat Flow picks" subtitle="Playlists for every mood">
              <div className="shelf">
                {editorial.map((p) => (
                  <PlaylistCard key={p.id} playlist={p} />
                ))}
              </div>
            </Section>
          )}

          {albums.length > 0 && (
            <Section
              title="New releases"
              action={
                <Link to="/library?view=albums" className="section-link">
                  Show all
                </Link>
              }
            >
              <div className="shelf">
                {albums.slice(0, 12).map((a) => (
                  <AlbumCard key={a.id} album={a} />
                ))}
              </div>
            </Section>
          )}

          <Section title="Trending now" subtitle="The most played songs on Beat Flow">
            <TrackList
              tracks={trending}
              context={{ id: 'trending', label: 'Trending now' }}
              showPlays={trending.some((t) => t.plays > 0)}
            />
          </Section>

          {artists.length > 0 && (
            <Section title="Popular artists">
              <div className="shelf">
                {artists.slice(0, 12).map((a) => (
                  <ArtistCard key={a.slug} artist={a} />
                ))}
              </div>
            </Section>
          )}

          <Section
            title="Fresh tracks"
            subtitle="The newest uploads"
            action={
              <Link to="/library?view=songs" className="section-link">
                Show all
              </Link>
            }
          >
            <div className="shelf">
              {tracks.slice(0, 12).map((t, i) => (
                <TrackCard key={t.id} track={t} tracks={tracks} index={i} context={FRESH} />
              ))}
            </div>
          </Section>
        </>
      )}
    </>
  )
}

function QuickTile({ item, tracks, onHover }) {
  const { context, currentId, isPlaying, playTracks, togglePlay } = usePlayer()
  const isThis = item.track ? currentId === item.id : context?.id === item.id
  const active = isThis && isPlaying

  const play = () => {
    if (isThis) return togglePlay()
    if (item.track) playTracks(tracks, item.index, FRESH)
    else playTracks(item.tracks, 0, { id: item.id, label: item.title })
  }

  const hover = { onMouseEnter: () => onHover(item.src || null), onMouseLeave: () => onHover(null) }
  const inner = (
    <>
      {item.art}
      <span className="quick-title">{item.title}</span>
      {active && <Equalizer className="quick-eq" />}
      <PlayButton size="sm" playing={active} onClick={play} className="quick-play" label={item.title} tabIndex={item.to ? -1 : undefined} />
    </>
  )

  return item.to ? (
    <Link to={item.to} className={`quick-tile${isThis ? ' is-current' : ''}`} {...hover}>
      {inner}
    </Link>
  ) : (
    <div className={`quick-tile${isThis ? ' is-current' : ''}`} onClick={play} {...hover}>
      {inner}
    </div>
  )
}
