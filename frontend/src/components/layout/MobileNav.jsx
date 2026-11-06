import { NavLink } from 'react-router-dom'
import { AudioLines, House, LibraryBig, Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function MobileNav() {
  const { isArtist } = useAuth()
  return (
    <nav className="mobile-nav" aria-label="Main">
      <NavLink to="/" end>
        <House /> Home
      </NavLink>
      <NavLink to="/search">
        <Search /> Search
      </NavLink>
      <NavLink to="/library">
        <LibraryBig /> Your Library
      </NavLink>
      {isArtist && (
        <NavLink to="/studio">
          <AudioLines /> Studio
        </NavLink>
      )}
    </nav>
  )
}
