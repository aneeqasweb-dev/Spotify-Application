import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, AtSign, Check, CircleAlert, CloudUpload, Disc3, Eye, EyeOff, Headphones, LoaderCircle, Lock,
  Mail, Mic, UserRound,
} from 'lucide-react'
import { authApi, getErrorMessage } from '../api/client'
import { imageUrl } from '../utils/cover'
import { Logo } from '../components/ui/Logo'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const ROLES = [
  { value: 'user', icon: Headphones, title: 'Listener', desc: 'Stream and discover music' },
  { value: 'artist', icon: Mic, title: 'Artist', desc: 'Upload tracks, release albums' },
]

// Decorative waveform heights (fixed so it looks the same every render)
const BARS = Array.from({ length: 56 }, (_, i) => {
  const h = 18 + 82 * Math.abs(Math.sin(i * 0.37)) * (0.55 + 0.45 * Math.sin(i * 0.13 + 1))
  return { h: Math.max(14, Math.round(h)), d: -((i * 0.09) % 1.6).toFixed(2) }
})

export default function AuthPage({ mode }) {
  const isLogin = mode === 'login'
  const { login, register, continueAsGuest } = useAuth()
  const toast = useToast()

  const [form, setForm] = useState({ identifier: '', username: '', email: '', password: '', role: 'user' })
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [guestLoading, setGuestLoading] = useState(false)
  const [highlights, setHighlights] = useState(null)

  // Real album covers + numbers for the left panel (public, no login needed)
  useEffect(() => {
    let alive = true
    authApi
      .highlights()
      .then((h) => alive && setHighlights(h))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  const tryAsGuest = async () => {
    setError('')
    setGuestLoading(true)
    try {
      await continueAsGuest()
      toast.success('Welcome! You’re exploring Beat Flow as a guest.')
    } catch (err) {
      setError(getErrorMessage(err, 'Couldn’t start a guest session. Please try again.'))
      setGuestLoading(false)
    }
  }

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const validate = () => {
    if (isLogin) {
      if (!form.identifier.trim()) return 'Enter your username or email.'
      if (!form.password) return 'Enter your password.'
      return ''
    }
    if (!form.username.trim()) return 'Choose a username.'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Enter a valid email address.'
    if (form.password.length < 6) return 'Password must be at least 6 characters.'
    return ''
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const problem = validate()
    if (problem) return setError(problem)

    setError('')
    setSubmitting(true)
    try {
      const user = isLogin
        ? await login(form.identifier, form.password)
        : await register({
            username: form.username.trim(),
            email: form.email.trim(),
            password: form.password,
            role: form.role,
          })
      toast.success(isLogin ? `Welcome back, ${user.username}` : `Welcome to Beat Flow, ${user.username}!`)
      // AuthContext now has a user, so GuestOnly redirects into the app
    } catch (err) {
      setError(getErrorMessage(err, isLogin ? 'Login failed. Please try again.' : 'Sign up failed. Please try again.'))
      setSubmitting(false)
    }
  }

  return (
    <div className="auth">
      <section className="auth-showcase">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />

        <div className="auth-showcase-inner">
          <Logo size={38} />

          <div className="showcase-copy">
            <span className="eyebrow">Stream · Upload · Share</span>
            <h1 className="display">
              Music that moves
              <br />
              with <span className="grad-text">you.</span>
            </h1>
            <p>
              Beat Flow is where listeners discover new sound and artists share it. Upload tracks, build albums and
              press play in seconds.
            </p>
          </div>

          {highlights?.covers?.length >= 6 ? (
            <div className="cover-wall" aria-hidden="true">
              {[0, 1].map((row) => {
                const covers = row ? [...highlights.covers].reverse() : highlights.covers
                return (
                  <div key={row} className={`cover-wall-row${row ? ' is-reverse' : ''}`}>
                    {[...covers, ...covers].map((src, i) => (
                      <img key={i} src={imageUrl(src, 240)} alt="" loading="lazy" />
                    ))}
                  </div>
                )
              })}
              <p className="cover-wall-stats">
                {highlights.songs} songs · {highlights.artists} artists · new playlists every week
              </p>
            </div>
          ) : (
            <div className="wave" aria-hidden="true">
              {BARS.map((b, i) => (
                <i key={i} style={{ '--h': `${b.h}%`, '--d': `${b.d}s` }} />
              ))}
            </div>
          )}

          <ul className="showcase-features">
            <li>
              <Headphones /> Unlimited listening
            </li>
            <li>
              <CloudUpload /> Artist uploads
            </li>
            <li>
              <Disc3 /> Albums &amp; queues
            </li>
          </ul>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-switch" data-active={isLogin ? 'login' : 'register'}>
            <span className="auth-switch-pill" aria-hidden="true" />
            <Link to="/login" className={isLogin ? 'is-active' : ''} aria-current={isLogin ? 'page' : undefined}>
              Log in
            </Link>
            <Link to="/register" className={!isLogin ? 'is-active' : ''} aria-current={!isLogin ? 'page' : undefined}>
              Sign up
            </Link>
          </div>

          <h2>{isLogin ? 'Welcome back' : 'Create your account'}</h2>
          <p className="auth-sub">
            {isLogin ? 'Log in to pick up where the music left off.' : 'Join as a listener, or share your sound as an artist.'}
          </p>

          <form className="auth-form" onSubmit={onSubmit} noValidate>
            {isLogin ? (
              <Field
                id="identifier"
                label="Username or email"
                icon={UserRound}
                value={form.identifier}
                onChange={update('identifier')}
                autoComplete="username"
                placeholder="you@example.com"
                autoFocus
              />
            ) : (
              <>
                <Field
                  id="username"
                  label="Username"
                  icon={AtSign}
                  value={form.username}
                  onChange={update('username')}
                  autoComplete="username"
                  placeholder="yourname"
                  autoFocus
                />
                <Field
                  id="email"
                  label="Email"
                  icon={Mail}
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </>
            )}

            <Field
              id="password"
              label="Password"
              icon={Lock}
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={update('password')}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              placeholder={isLogin ? 'Your password' : 'At least 6 characters'}
            >
              <button
                type="button"
                className="input-action"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </Field>

            {!isLogin && (
              <fieldset className="role-picker">
                <legend>I’m joining as</legend>
                {ROLES.map((r) => {
                  const selected = form.role === r.value
                  return (
                    <label key={r.value} className={`role-option${selected ? ' is-selected' : ''}`}>
                      <input
                        type="radio"
                        name="role"
                        value={r.value}
                        checked={selected}
                        onChange={update('role')}
                        className="sr-only"
                      />
                      <r.icon className="role-icon" />
                      <strong>{r.title}</strong>
                      <span>{r.desc}</span>
                      <span className="role-check" aria-hidden="true">
                        <Check />
                      </span>
                    </label>
                  )
                })}
              </fieldset>
            )}

            {error && (
              <div className="form-error" role="alert">
                <CircleAlert />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
              {submitting ? (
                <>
                  <LoaderCircle className="spin" /> {isLogin ? 'Logging in…' : 'Creating account…'}
                </>
              ) : (
                <>
                  {isLogin ? 'Log in' : 'Create account'} <ArrowRight />
                </>
              )}
            </button>
          </form>

          <div className="auth-or">
            <span>or</span>
          </div>
          <button type="button" className="btn btn-ghost btn-lg btn-block" onClick={tryAsGuest} disabled={guestLoading || submitting}>
            {guestLoading ? (
              <>
                <LoaderCircle className="spin" /> Starting…
              </>
            ) : (
              <>
                <Headphones /> Continue as guest
              </>
            )}
          </button>
          <p className="auth-guest-note">No sign-up needed — try every feature with a temporary account.</p>

          <p className="auth-foot">
            {isLogin ? (
              <>
                New to Beat Flow? <Link to="/register">Create an account</Link>
              </>
            ) : (
              <>
                Already have an account? <Link to="/login">Log in</Link>
              </>
            )}
          </p>
        </div>
      </section>
    </div>
  )
}

function Field({ id, label, icon: Icon, children, ...inputProps }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        <Icon className="input-icon" />
        <input id={id} className="input" {...inputProps} />
        {children}
      </div>
    </div>
  )
}
