import { Pause, Play } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCollection } from '../../context/CollectionContext'
import { useLibrary } from '../../context/LibraryContext'
import { usePlayer } from '../../context/PlayerContext'
import { greeting } from '../../utils/format'
import HeadphonesArt from './HeadphonesArt'

// "Turn Up The Music" banner at the top of Home. Play Now starts Hot Hits (or everything, shuffled).
export default function HeroBanner() {
  const { user } = useAuth()
  const { tracks } = useLibrary()
  const { playlists } = useCollection()
  const { context, isPlaying, playTracks, shufflePlay, togglePlay } = usePlayer()
  const hits = playlists.find((p) => p.name === 'Hot Hits' && p.tracks.length)
  const ctxId = hits ? hits.id : 'library'
  const active = context?.id === ctxId && isPlaying

  const playNow = () => {
    if (context?.id === ctxId) return togglePlay()
    if (hits) playTracks(hits.tracks, 0, { id: hits.id, label: hits.name })
    else shufflePlay(tracks, { id: 'library', label: 'All songs' })
  }

  return (
    <section className="hero-banner">
      <svg className="hero-waves" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 220 C 180 150, 320 260, 520 200 S 860 120, 1000 190 L1000 300 L0 300Z" fill="#ddd2fb" opacity="0.7" />
        <path d="M0 255 C 220 205, 420 290, 640 240 S 900 200, 1000 230 L1000 300 L0 300Z" fill="#cdbdfa" opacity="0.7" />
      </svg>
      <div className="hero-copy">
        <span className="hero-greeting">
          {greeting()}, {user.username}
        </span>
        <h1 className="hero-title">
          Turn Up
          <br />
          The Music
        </h1>
        <p className="hero-sub">Your personal music space.</p>
        <button type="button" className="btn btn-primary btn-lg hero-play" onClick={playNow} disabled={!tracks.length}>
          {active ? 'Pause' : 'Play Now'}
          {active ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
        </button>
      </div>
      <HeadphonesArt className="hero-art" />
    </section>
  )
}
