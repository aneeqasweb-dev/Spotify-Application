import { Link } from 'react-router-dom'
import { usePlayer } from '../../context/PlayerContext'
import PlayButton from '../ui/PlayButton'

// Big picture card with the title on top of the image (Recently Played)
export default function RecentCard({ id, title, to, art, tracks }) {
  const { context, isPlaying, playTracks, togglePlay } = usePlayer()
  const isThis = context?.id === id
  const play = () => (isThis ? togglePlay() : playTracks(tracks, 0, { id, label: title }))

  return (
    <Link to={to} className={`recent-card${isThis ? ' is-current' : ''}`}>
      <div className="recent-art">{art}</div>
      <span className="recent-title">{title}</span>
      {tracks.length > 0 && (
        <PlayButton size="md" playing={isThis && isPlaying} onClick={play} className="recent-play" label={title} tabIndex={-1} />
      )}
    </Link>
  )
}
