import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LogoMark } from '../ui/Logo'

export function Splash() {
  return (
    <div className="splash" role="status" aria-label="Loading Beat Flow">
      <LogoMark size={56} />
      <div className="splash-bar">
        <span />
      </div>
    </div>
  )
}

// Pages that need a logged-in user
export function RequireAuth({ children }) {
  const { user, status, signedOut } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <Splash />
  if (!user) {
    // Remember the page so we can come back after logging in — unless they just chose to log out
    const state = signedOut ? undefined : { from: location.pathname + location.search }
    return <Navigate to="/login" replace state={state} />
  }
  return children
}

// Login / register: skip them if already logged in
export function GuestOnly({ children }) {
  const { user, status } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <Splash />
  if (user) return <Navigate to={location.state?.from || '/'} replace />
  return children
}
