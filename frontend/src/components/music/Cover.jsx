import { useState } from 'react'
import { coverArt, imageUrl } from '../../utils/cover'

// Shows the real cover picture when there is one; otherwise generated artwork.
// `size` = fixed pixel size (rows, player). Without it the cover fills its box (cards).
export default function Cover(props) {
  // Re-mount when the picture changes, so a previous load error doesn't stick
  return <CoverInner key={props.src || 'generated'} {...props} />
}

function CoverInner({ src, seed, title, label = false, round = false, size, res, eager = false, className = '' }) {
  const [failed, setFailed] = useState(false)
  const sizeStyle = size ? { width: size, height: size } : null
  const base = `cover${round ? ' cover-round' : ''} ${className}`

  if (src && !failed) {
    // Cards are ~180px wide, so a 360px picture stays sharp on high-density screens without wasting data
    const px = res ?? (typeof size === 'number' ? size * 2 : 360)
    // Big pictures: show a tiny version straight away while the sharp one downloads
    const placeholder = px >= 300 ? { backgroundImage: `url("${imageUrl(src, 112)}")` } : null
    return (
      <div className={`${base} cover-img`} style={{ ...sizeStyle, ...placeholder }} aria-hidden="true">
        <img
          src={imageUrl(src, px)}
          alt=""
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable="false"
          onError={() => setFailed(true)}
        />
      </div>
    )
  }

  const art = coverArt(seed ?? title)
  return (
    <div className={base} style={{ background: art.background, ...sizeStyle }} aria-hidden="true">
      {art.pattern === 'rings' && <div className="cover-rings" />}
      {art.pattern === 'grid' && <div className="cover-grid" />}
      {art.pattern === 'wave' && (
        <svg className="cover-wave" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d={art.wave} />
        </svg>
      )}
      {label && (
        <div className="cover-label">
          <span className="cover-brand">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span className="cover-title">{title}</span>
        </div>
      )}
    </div>
  )
}
