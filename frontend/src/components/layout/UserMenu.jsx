import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AudioLines, ChevronDown, LibraryBig, LogOut, UserPlus } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import Avatar from '../ui/Avatar'

// Profile menu. variant "avatar" = round picture (top bar), "chip" = picture + name (sidebar footer)
export default function UserMenu({ variant = 'avatar', placement = 'down' }) {
  const { user, isArtist, isGuest, logout } = useAuth()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

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

  const handleLogout = async () => {
    setOpen(false)
    try {
      await logout()
      toast.info('You’ve been logged out. See you soon!')
    } catch {
      toast.error('Couldn’t reach the server, but you’ve been signed out here.')
    }
  }

  return (
    <div className={`user-menu is-${placement}`} ref={ref}>
      {variant === 'chip' ? (
        <button type="button" className="user-chip" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu">
          <Avatar name={user.username} seed={user.id} size="md" />
          <span className="user-chip-name">{user.username}</span>
          <ChevronDown className={`user-chip-caret${open ? ' is-open' : ''}`} />
        </button>
      ) : (
        <button
          type="button"
          className="user-avatar-btn"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Your account"
          title={user.username}
        >
          <Avatar name={user.username} seed={user.id} size="md" />
        </button>
      )}

      {open && (
        <div className="menu" role="menu">
          <div className="menu-head">
            <Avatar name={user.username} seed={user.id} size="md" />
            <div className="menu-head-text">
              <strong>{user.username}</strong>
              <span>{isGuest ? 'Guest account' : user.email}</span>
            </div>
          </div>
          <span className={`role-badge${isArtist ? ' is-artist' : ''}`}>
            {isGuest ? 'Guest · deleted after 7 days' : isArtist ? 'Artist account' : 'Listener account'}
          </span>
          <div className="menu-sep" />
          {isArtist && (
            <Link role="menuitem" to="/studio" className="menu-item" onClick={() => setOpen(false)}>
              <AudioLines /> Artist Studio
            </Link>
          )}
          <Link role="menuitem" to="/library" className="menu-item" onClick={() => setOpen(false)}>
            <LibraryBig /> Your Library
          </Link>
          {isGuest && (
            <button
              type="button"
              role="menuitem"
              className="menu-item"
              onClick={async () => {
                await logout().catch(() => {})
                window.location.assign('/register') // fresh page: guest session gone, sign-up form open
              }}
            >
              <UserPlus /> Create a free account
            </button>
          )}
          <button type="button" role="menuitem" className="menu-item" onClick={handleLogout}>
            <LogOut /> Log out
          </button>
        </div>
      )}
    </div>
  )
}
