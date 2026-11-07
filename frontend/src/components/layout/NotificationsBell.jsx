import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCollection } from '../../context/CollectionContext'
import { useLibrary } from '../../context/LibraryContext'
import { dateFromId, timeAgo } from '../../utils/format'
import AlbumArt from '../music/AlbumArt'

// "What's new": the newest albums and playlists. A dot shows until you open it.
export default function NotificationsBell() {
  const { user } = useAuth()
  const { albums } = useLibrary()
  const { playlists } = useCollection()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const seenKey = `beatflow:news-seen:${user.id}`
  const [seenAt, setSeenAt] = useState(() => {
    try {
      return Number(localStorage.getItem(seenKey)) || 0
    } catch {
      return 0
    }
  })

  const items = useMemo(() => {
    const list = [
      ...albums.map((a) => ({ id: a.id, kind: 'Album', title: a.title, sub: a.byline, to: `/album/${a.id}`, art: a, time: dateFromId(a.id)?.getTime() || 0 })),
      ...playlists
        .filter((p) => p.curator)
        .map((p) => ({ id: p.id, kind: 'Playlist', title: p.name, sub: `By ${p.madeBy}`, to: `/playlist/${p.id}`, art: p, time: dateFromId(p.id)?.getTime() || 0 })),
    ]
    return list.sort((a, b) => b.time - a.time).slice(0, 8)
  }, [albums, playlists])

  const unread = items.some((i) => i.time > seenAt)

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const toggle = () => {
    setOpen((o) => !o)
    if (!open) {
      const now = Date.now()
      setSeenAt(now)
      try {
        localStorage.setItem(seenKey, String(now))
      } catch {
        /* storage unavailable */
      }
    }
  }

  return (
    <div className="bell" ref={ref}>
      <button type="button" className="bell-btn" onClick={toggle} aria-label={unread ? "What's new (new items)" : "What's new"} aria-expanded={open} title="What's new">
        <Bell />
        {unread && <span className="bell-dot" />}
      </button>
      {open && (
        <div className="menu bell-menu" role="dialog" aria-label="What's new">
          <h3 className="bell-title">What’s new</h3>
          {items.length ? (
            <ul>
              {items.map((i) => (
                <li key={i.id}>
                  <Link to={i.to} className="bell-item" onClick={() => setOpen(false)}>
                    <AlbumArt album={i.art} size={44} label={false} placeholder />
                    <span className="bell-item-text">
                      <strong>{i.title}</strong>
                      <small>
                        {i.kind} · {i.sub}
                      </small>
                    </span>
                    <span className="bell-time">{timeAgo(new Date(i.time))}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted bell-empty">Nothing new yet.</p>
          )}
        </div>
      )}
    </div>
  )
}
