import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Upload, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { LogoMark } from '../ui/Logo'
import NotificationsBell from './NotificationsBell'
import UserMenu from './UserMenu'

export default function TopBar({ scrolled }) {
  const { isArtist } = useAuth()

  return (
    <header className={`topbar${scrolled ? ' is-scrolled' : ''}`}>
      <Link to="/" className="topbar-logo" aria-label="Beat Flow home">
        <LogoMark size={34} />
      </Link>
      <SearchField />
      <div className="topbar-right">
        {isArtist && (
          <Link to="/studio" className="btn btn-soft btn-sm topbar-upload">
            <Upload /> Upload
          </Link>
        )}
        <NotificationsBell />
        <UserMenu variant="avatar" />
      </div>
    </header>
  )
}

// Search box in the top bar: typing opens the Search page with live results
function SearchField() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const onSearchPage = location.pathname === '/search'
  const urlQ = onSearchPage ? (params.get('q') ?? '') : ''
  // Which search box changed the URL ('topbar' or 'page'), so each box only ignores its own typing
  const typedIn = location.state?.typedIn
  const [q, setQ] = useState(urlQ)
  const inputRef = useRef(null)

  // Follow the URL when it changes from elsewhere (the Search page box, an artist link, leaving the page…)
  useEffect(() => {
    if (typedIn !== 'topbar') setQ(urlQ)
  }, [urlQ, typedIn])

  useEffect(() => {
    if (onSearchPage && !typedIn) inputRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSearchPage])

  const change = (value) => {
    setQ(value)
    navigate(value ? `/search?q=${encodeURIComponent(value)}` : '/search', { replace: onSearchPage, state: { typedIn: 'topbar' } })
  }

  return (
    <div className="topbar-search">
      <Search className="topbar-search-icon" />
      <input
        ref={inputRef}
        type="search"
        value={q}
        onChange={(e) => change(e.target.value)}
        onFocus={() => !onSearchPage && navigate('/search', { state: { typedIn: 'topbar' } })}
        placeholder="Search songs, artists…"
        aria-label="Search songs, artists, albums and playlists"
      />
      {q && (
        <button type="button" className="topbar-search-clear" onClick={() => change('')} aria-label="Clear search">
          <X />
        </button>
      )}
    </div>
  )
}
