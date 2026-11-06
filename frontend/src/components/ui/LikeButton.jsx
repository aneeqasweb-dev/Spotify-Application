import { Heart } from 'lucide-react'
import { useCollection } from '../../context/CollectionContext'

// The heart: save a song to (or remove it from) Liked Songs
export default function LikeButton({ track, size = 16, className = '' }) {
  const { isLiked, toggleLike } = useCollection()
  const liked = isLiked(track.id)
  const label = liked ? 'Remove from Liked Songs' : 'Save to Liked Songs'

  return (
    <button
      type="button"
      className={`like-btn${liked ? ' is-liked' : ''} ${className}`}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleLike(track)
      }}
      aria-label={label}
      aria-pressed={liked}
      title={label}
    >
      <Heart size={size} fill={liked ? 'currentColor' : 'none'} />
    </button>
  )
}
