import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, AudioLines } from 'lucide-react'
import HeroBanner from '../components/home/HeroBanner'
import MoodArt from '../components/home/MoodArt'
import MoodTile from '../components/home/MoodTile'
import RecentCard from '../components/home/RecentCard'
import AlbumArt, { LikedArt } from '../components/music/AlbumArt'
import { AlbumCard, ArtistCard, MixCard, PlaylistCard } from '../components/music/Cards'
import Cover from '../components/music/Cover'
import TrackList from '../components/music/TrackList'
import EmptyState, { ErrorState } from '../components/ui/EmptyState'
import Section from '../components/ui/Section'
import { CardSkeletons } from '../components/ui/Skeletons'
import { useAuth } from '../context/AuthContext'
import { useCollection } from '../context/CollectionContext'
import { useLibrary } from '../context/LibraryContext'
import { useRecentContexts } from '../hooks/useRecentContexts'
import { findMood, MOODS, moodTracks } from '../utils/moods'

const SeeAll = ({ to }) => (
  <Link to={to} className="section-link">
    See all <ArrowRight size={16} />
  </Link>
)

export default function HomePage() {
  const { user, isArtist } = useAuth()
  const { tracks, albums, artists, genres, status, error, refresh } = useLibrary()
  const { likedTracks, playlists } = useCollection()
  const recentIds = useRecentContexts(user.id)

  // "Recently Played": what you played, then Liked Songs and Beat Flow picks to fill the row
  const recent = useMemo(() => {
    const resolve = (id) => {
      if (id === 'liked') return { id, title: 'Liked Songs', to: '/collection/tracks', tracks: likedTracks, art: <LikedArt /> }
      const p = playlists.find((x) => x.id === id)
      if (p) return { id, title: p.name, to: `/playlist/${p.id}`, tracks: p.tracks, art: <AlbumArt album={p} placeholder /> }
      const a = albums.find((x) => x.id === id)
      if (a) return { id, title: a.title, to: `/album/${a.id}`, tracks: a.tracks, art: <AlbumArt album={a} /> }
      if (id.startsWith('genre:')) {
        const g = genres.find((x) => `genre:${x.slug}` === id)
        if (g) return { id, title: `${g.name} Mix`, to: `/genre/${g.slug}`, tracks: g.tracks, art: <AlbumArt album={{ id, title: g.name, coverUrl: '', tracks: g.tracks }} /> }
      }
      if (id.startsWith('artist:')) {
        const ar = artists.find((x) => `artist:${x.slug}` === id)
        if (ar) return { id, title: ar.name, to: `/artist/${ar.slug}`, tracks: ar.tracks, art: <Cover src={ar.coverUrl} seed={ar.slug} /> }
      }
      if (id.startsWith('mood:')) {
        const m = findMood(id.slice(5))
        if (m) return { id, title: m.name, to: `/mood/${m.slug}`, tracks: moodTracks(m, tracks, playlists), art: <MoodArt mood={m} /> }
      }
      return null
    }
    const ids = [...recentIds, 'liked', ...playlists.filter((p) => p.curator).map((p) => p.id)]
    const seen = new Set()
    const cards = []
    for (const id of ids) {
      if (seen.has(id)) continue
      seen.add(id)
      const card = resolve(id)
      if (card) cards.push(card)
      if (cards.length === 5) break
    }
    return cards
  }, [recentIds, likedTracks, playlists, albums, genres, artists, tracks])

  const editorial = playlists.filter((p) => p.curator && p.tracks.length)
  const trending = useMemo(() => [...tracks].sort((a, b) => b.plays - a.plays).slice(0, 6), [tracks])
  const mixes = genres.filter((g) => g.tracks.length >= 2).slice(0, 8)
  const ready = status === 'ready'

  return (
    <>
      <HeroBanner />

      {status === 'loading' && <CardSkeletons count={5} />}
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
          <Section title="Recently Played" action={<SeeAll to="/library" />}>
            <div className="recent-row">
              {recent.map((c) => (
                <RecentCard key={c.id} {...c} />
              ))}
            </div>
          </Section>

          <Section title="Browse by Mood" action={<SeeAll to="/search" />}>
            <div className="mood-row">
              {MOODS.map((m) => (
                <MoodTile key={m.slug} mood={m} />
              ))}
            </div>
          </Section>

          {mixes.length > 0 && (
            <Section title={`Made for ${user.username}`} subtitle="Mixes of the sounds you can find on Beat Flow">
              <div className="shelf">
                {mixes.map((g) => (
                  <MixCard key={g.slug} genre={g} />
                ))}
              </div>
            </Section>
          )}

          {editorial.length > 0 && (
            <Section title="Beat Flow picks" subtitle="Playlists for every moment" action={<SeeAll to="/library?view=playlists" />}>
              <div className="shelf">
                {editorial.map((p) => (
                  <PlaylistCard key={p.id} playlist={p} />
                ))}
              </div>
            </Section>
          )}

          {albums.length > 0 && (
            <Section title="New releases" action={<SeeAll to="/library?view=albums" />}>
              <div className="shelf">
                {albums.slice(0, 12).map((a) => (
                  <AlbumCard key={a.id} album={a} />
                ))}
              </div>
            </Section>
          )}

          <Section title="Trending now" subtitle="The most played songs on Beat Flow" action={<SeeAll to="/library?view=songs" />}>
            <TrackList tracks={trending} context={{ id: 'trending', label: 'Trending now' }} showPlays={trending.some((t) => t.plays > 0)} />
          </Section>

          {artists.length > 0 && (
            <Section title="Popular artists" action={<SeeAll to="/library?view=artists" />}>
              <div className="shelf">
                {artists.slice(0, 12).map((a) => (
                  <ArtistCard key={a.slug} artist={a} />
                ))}
              </div>
            </Section>
          )}
        </>
      )}
    </>
  )
}
