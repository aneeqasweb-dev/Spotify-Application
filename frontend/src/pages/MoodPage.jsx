import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Music2 } from 'lucide-react'
import MoodArt from '../components/home/MoodArt'
import CollectionHeader, { ActionBar } from '../components/music/CollectionHeader'
import TrackList from '../components/music/TrackList'
import EmptyState from '../components/ui/EmptyState'
import PageWash from '../components/ui/PageWash'
import { RowSkeletons } from '../components/ui/Skeletons'
import { useCollection } from '../context/CollectionContext'
import { useLibrary } from '../context/LibraryContext'
import { usePlayer } from '../context/PlayerContext'
import { totalLength, plural } from '../utils/format'
import { findMood, moodTracks } from '../utils/moods'

// "Browse by Mood" → Happy / Relax / Workout / Sleep / Love
export default function MoodPage() {
  const { slug } = useParams()
  const mood = findMood(slug)
  const { tracks, status } = useLibrary()
  const { playlists } = useCollection()
  const { context, isPlaying, playTracks, togglePlay, shufflePlay } = usePlayer()
  const list = useMemo(() => (mood ? moodTracks(mood, tracks, playlists) : []), [mood, tracks, playlists])

  if (!mood) {
    return (
      <EmptyState icon={Music2} title="Mood not found" action={<Link to="/" className="btn btn-soft">Back to Home</Link>}>
        Try one of the moods on the Home page.
      </EmptyState>
    )
  }
  if (status === 'loading') return <RowSkeletons count={6} />

  const ctx = { id: `mood:${slug}`, label: mood.name }
  const isThis = context?.id === ctx.id
  const length = totalLength(list)

  return (
    <>
      <PageWash color={mood.colors[0]} strong />
      <CollectionHeader
        art={<MoodArt mood={mood} />}
        eyebrow="Mood"
        title={mood.name}
        description={mood.tagline}
        meta={
          <span>
            <strong>Beat Flow</strong> · {plural(list.length, 'song')}
            {length && <span className="muted">, {length}</span>}
          </span>
        }
      />
      {list.length ? (
        <>
          <ActionBar
            label={mood.name}
            playing={isThis && isPlaying}
            onPlay={() => (isThis ? togglePlay() : playTracks(list, 0, ctx))}
            onShuffle={() => shufflePlay(list, ctx)}
          />
          <TrackList tracks={list} context={ctx} />
        </>
      ) : (
        <EmptyState icon={Music2} title="No songs for this mood yet">
          As more music arrives, it’ll show up here.
        </EmptyState>
      )}
    </>
  )
}
