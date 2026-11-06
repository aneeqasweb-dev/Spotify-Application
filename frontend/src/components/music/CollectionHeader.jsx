import { Shuffle } from 'lucide-react'
import PlayButton from '../ui/PlayButton'

// The big header on album / playlist / artist / Liked Songs / genre pages
export default function CollectionHeader({ art, eyebrow, title, description, meta, round = false, onEdit }) {
  const size = title.length > 28 ? 'is-long' : title.length > 14 ? 'is-medium' : ''
  const editable = Boolean(onEdit)

  return (
    <header className="collection-hero">
      <div
        className={`collection-art${round ? ' is-round' : ''}${editable ? ' is-editable' : ''}`}
        onClick={onEdit}
        role={editable ? 'button' : undefined}
        tabIndex={editable ? 0 : undefined}
        onKeyDown={editable ? (e) => e.key === 'Enter' && onEdit() : undefined}
        title={editable ? 'Edit details' : undefined}
      >
        {art}
      </div>
      <div className="collection-info">
        <span className="eyebrow">{eyebrow}</span>
        <h1
          className={`collection-title ${size}${editable ? ' is-editable' : ''}`}
          onClick={onEdit}
          title={editable ? 'Edit details' : undefined}
        >
          {title}
        </h1>
        {description && <p className="collection-desc">{description}</p>}
        <div className="collection-meta">{meta}</div>
      </div>
    </header>
  )
}

// Play + Shuffle (+ any extra buttons) under the header
export function ActionBar({ playing, onPlay, onShuffle, label, children, disabled = false }) {
  return (
    <div className="action-row">
      {!disabled && <PlayButton size="lg" playing={playing} onClick={onPlay} label={label} />}
      {!disabled && onShuffle && (
        <button type="button" className="icon-btn icon-btn-lg" onClick={onShuffle} aria-label={`Shuffle ${label}`} title="Shuffle">
          <Shuffle />
        </button>
      )}
      {children}
    </div>
  )
}
