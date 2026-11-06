import { Heart, Music2 } from 'lucide-react'
import { imageUrl } from '../../utils/cover'
import Cover from './Cover'

// The picture to use for an album or playlist: its own cover, or the first song that has one
export function albumCoverSrc(item) {
  return item.coverUrl || item.tracks.find((t) => t.coverUrl)?.coverUrl || ''
}

// Artwork for an album or playlist:
// own cover → 2×2 mosaic of 4 different song covers → first song cover → placeholder / generated
export default function AlbumArt({ album, size, res, eager, label = true, placeholder = false, className = '' }) {
  const title = album.title ?? album.name
  if (album.coverUrl) {
    return <Cover src={album.coverUrl} seed={album.id} size={size} res={res} eager={eager} className={className} />
  }

  const covers = [...new Set(album.tracks.map((t) => t.coverUrl).filter(Boolean))]

  if (covers.length >= 4) {
    const px = typeof size === 'number' ? size : 260
    return (
      <div
        className={`cover cover-mosaic ${className}`}
        style={size ? { width: size, height: size } : undefined}
        aria-hidden="true"
      >
        {covers.slice(0, 4).map((src) => (
          <img key={src} src={imageUrl(src, px)} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" />
        ))}
      </div>
    )
  }

  if (covers.length) {
    return <Cover src={covers[0]} seed={album.id} size={size} res={res} eager={eager} className={className} />
  }

  if (placeholder) {
    return (
      <div className={`cover cover-placeholder ${className}`} style={size ? { width: size, height: size } : undefined} aria-hidden="true">
        <Music2 />
      </div>
    )
  }

  return <Cover seed={album.id} title={title} label={label} size={size} className={className} />
}

// The Liked Songs cover: blue gradient with a white heart
export function LikedArt({ size, className = '' }) {
  return (
    <div className={`cover cover-liked ${className}`} style={size ? { width: size, height: size } : undefined} aria-hidden="true">
      <Heart fill="currentColor" />
    </div>
  )
}
