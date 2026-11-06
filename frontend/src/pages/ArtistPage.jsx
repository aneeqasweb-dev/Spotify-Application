import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { UserRound } from 'lucide-react'
import { AlbumCard, PlaylistCard } from '../components/music/Cards'
import CollectionHeader, { ActionBar } from '../components/music/CollectionHeader'
import Cover from '../components/music/Cover'
import TrackList from '../components/music/TrackList'
import Avatar from '../components/ui/Avatar'
import EmptyState from '../components/ui/EmptyState'
import PageWash from '../components/ui/PageWash'
import Section from '../components/ui/Section'
import { RowSkeletons } from '../components/ui/Skeletons'
import { useCollection } from '../context/CollectionContext'
import { useLibrary } from '../context/LibraryContext'
import { usePlayer } from '../context/PlayerContext'
import { useDominantColor } from '../hooks/useDominantColor'
import { creditSummary } from '../utils/artists'
import { coverArt } from '../utils/cover'
import { plural } from '../utils/format'

export default function ArtistPage() {
  const { slug } = useParams()
  const { artists, albums, status } = useLibrary()
  const { playlists } = useCollection()
  const { context, isPlaying, playTracks, togglePlay, shufflePlay } = usePlayer()
  const [showAll, setShowAll] = useState(false)
  const artist = artists.find((a) => a.slug === slug)
  const wash = useDominantColor(artist?.coverUrl, coverArt(slug).colors[0])

  if (status === 'loading') return <RowSkeletons count={6} />
  if (!artist) {
    return (
      <EmptyState icon={UserRound} title="Artist not found" action={<Link to="/search" className="btn btn-ghost">Search for music</Link>}>
        We couldn’t find this artist on Beat Flow.
      </EmptyState>
    )
  }

  const hasArtist = (t) => t.artists.some((a) => a.slug === slug)
  const popular = [...artist.tracks].sort((a, b) => b.plays - a.plays)
  const discography = albums.filter((a) => a.tracks.some(hasArtist))
  const featuredIn = playlists.filter((p) => p.tracks.some(hasArtist))
  const credits = creditSummary(artist.tracks)
  const ctx = { id: `artist:${slug}`, label: artist.name }
  const isThis = context?.id === ctx.id

  return (
    <>
      <PageWash color={wash} strong />
      <CollectionHeader
        round
        art={
          artist.coverUrl ? (
            <Cover src={artist.coverUrl} seed={slug} round res={560} eager />
          ) : (
            <Avatar name={artist.name} seed={slug} size="xl" />
          )
        }
        eyebrow="Artist"
        title={artist.name}
        meta={
          <span>
            {plural(artist.tracks.length, 'song')} · {artist.plays.toLocaleString()} {artist.plays === 1 ? 'play' : 'plays'}
          </span>
        }
      />

      <ActionBar
        label={artist.name}
        playing={isThis && isPlaying}
        onPlay={() => (isThis ? togglePlay() : playTracks(popular, 0, ctx))}
        onShuffle={() => shufflePlay(artist.tracks, ctx)}
      />

      <Section title="Popular">
        <TrackList tracks={showAll ? popular : popular.slice(0, 5)} context={ctx} showPlays />
        {popular.length > 5 && (
          <button type="button" className="link-btn see-more" onClick={() => setShowAll((s) => !s)}>
            {showAll ? 'Show less' : 'See more'}
          </button>
        )}
      </Section>

      {discography.length > 0 && (
        <Section title="Discography">
          <div className="shelf">
            {discography.map((a) => (
              <AlbumCard key={a.id} album={a} />
            ))}
          </div>
        </Section>
      )}

      {featuredIn.length > 0 && (
        <Section title={`Featuring ${artist.name}`}>
          <div className="shelf">
            {featuredIn.map((p) => (
              <PlaylistCard key={p.id} playlist={p} />
            ))}
          </div>
        </Section>
      )}

      <Section title="About">
        <div className="about-card" style={{ '--about': wash }}>
          <div className="about-stats">
            <div>
              <strong>{artist.plays.toLocaleString()}</strong>
              <span>plays on Beat Flow</span>
            </div>
            <div>
              <strong>{artist.tracks.length}</strong>
              <span>{artist.tracks.length === 1 ? 'song' : 'songs'}</span>
            </div>
            <div>
              <strong>{discography.length}</strong>
              <span>{discography.length === 1 ? 'album' : 'albums'}</span>
            </div>
          </div>
          {credits.map((c) => (
            <p key={c} className="about-credits">
              {c}
            </p>
          ))}
        </div>
      </Section>
    </>
  )
}
