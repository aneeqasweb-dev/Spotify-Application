import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { LikedArt } from '../components/music/AlbumArt'
import CollectionHeader, { ActionBar } from '../components/music/CollectionHeader'
import TrackList from '../components/music/TrackList'
import EmptyState from '../components/ui/EmptyState'
import PageWash from '../components/ui/PageWash'
import { useAuth } from '../context/AuthContext'
import { useCollection } from '../context/CollectionContext'
import { usePlayer } from '../context/PlayerContext'
import { plural, totalLength } from '../utils/format'

const CTX = { id: 'liked', label: 'Liked Songs' }

export default function LikedSongsPage() {
  const { user } = useAuth()
  const { likedTracks } = useCollection()
  const { context, isPlaying, playTracks, togglePlay, shufflePlay } = usePlayer()
  const isThis = context?.id === CTX.id
  const length = totalLength(likedTracks)

  return (
    <>
      <PageWash color="#3b4fd8" strong />
      <CollectionHeader
        art={<LikedArt />}
        eyebrow="Playlist"
        title="Liked Songs"
        meta={
          <span>
            <strong>{user.username}</strong> · {plural(likedTracks.length, 'song')}
            {length && <span className="muted">, {length}</span>}
          </span>
        }
      />
      {likedTracks.length ? (
        <>
          <ActionBar
            label="Liked Songs"
            playing={isThis && isPlaying}
            onPlay={() => (isThis ? togglePlay() : playTracks(likedTracks, 0, CTX))}
            onShuffle={() => shufflePlay(likedTracks, CTX)}
          />
          <TrackList tracks={likedTracks} context={CTX} />
        </>
      ) : (
        <EmptyState
          icon={Heart}
          title="Songs you like will appear here"
          action={
            <Link to="/search" className="btn btn-light">
              Find songs
            </Link>
          }
        >
          Save songs by tapping the heart icon.
        </EmptyState>
      )}
    </>
  )
}
