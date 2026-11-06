import { Link, useParams } from 'react-router-dom'
import { Music2 } from 'lucide-react'
import AlbumArt from '../components/music/AlbumArt'
import { mixDetails } from '../components/music/Cards'
import CollectionHeader, { ActionBar } from '../components/music/CollectionHeader'
import TrackList from '../components/music/TrackList'
import EmptyState from '../components/ui/EmptyState'
import PageWash from '../components/ui/PageWash'
import { RowSkeletons } from '../components/ui/Skeletons'
import { useLibrary } from '../context/LibraryContext'
import { usePlayer } from '../context/PlayerContext'
import { coverArt } from '../utils/cover'
import { plural, totalLength } from '../utils/format'

// A genre "mix": every song in that genre, most played first
export default function GenrePage() {
  const { slug } = useParams()
  const { genres, status } = useLibrary()
  const { context, isPlaying, playTracks, togglePlay, shufflePlay } = usePlayer()
  const genre = genres.find((g) => g.slug === slug)

  if (status === 'loading') return <RowSkeletons count={6} />
  if (!genre) {
    return (
      <EmptyState icon={Music2} title="Nothing here yet" action={<Link to="/search" className="btn btn-ghost">Browse all</Link>}>
        There are no songs in this genre yet.
      </EmptyState>
    )
  }

  const tracks = [...genre.tracks].sort((a, b) => b.plays - a.plays)
  const ctx = { id: `genre:${slug}`, label: `${genre.name} Mix` }
  const isThis = context?.id === ctx.id
  const [color] = coverArt(slug).colors
  const length = totalLength(tracks)
  const names = mixDetails(genre).ranked

  return (
    <>
      <PageWash color={color} strong />
      <CollectionHeader
        art={<AlbumArt album={{ id: slug, title: genre.name, coverUrl: '', tracks }} res={560} eager />}
        eyebrow="Mix"
        title={`${genre.name} Mix`}
        description={`${names.slice(0, 3).join(', ')}${names.length > 3 ? ' and more' : ''}. Updated whenever new ${genre.name} songs arrive.`}
        meta={
          <span>
            <strong>Beat Flow</strong> · {plural(tracks.length, 'song')}
            {length && <span className="muted">, {length}</span>}
          </span>
        }
      />
      <ActionBar
        label={ctx.label}
        playing={isThis && isPlaying}
        onPlay={() => (isThis ? togglePlay() : playTracks(tracks, 0, ctx))}
        onShuffle={() => shufflePlay(tracks, ctx)}
      />
      <TrackList tracks={tracks} context={ctx} />
    </>
  )
}
