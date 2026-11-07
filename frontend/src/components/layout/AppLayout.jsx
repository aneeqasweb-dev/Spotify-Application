import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { usePlayer } from '../../context/PlayerContext'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import NowPlaying from '../player/NowPlaying'
import NowPlayingPanel from '../player/NowPlayingPanel'
import PlayerBar from '../player/PlayerBar'
import QueuePanel from '../player/QueuePanel'
import MobileNav from './MobileNav'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function AppLayout() {
  const mainRef = useRef(null)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  const { queueOpen } = usePlayer()
  // Wide screens: player + queue live in the right-hand panel. Smaller screens: player bar at the bottom.
  const wide = useMediaQuery('(min-width: 1280px)')

  // New page → start at the top
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className={`app-shell${wide ? ' is-wide' : ''}${!wide && queueOpen ? ' has-queue' : ''}`}>
      <Sidebar />
      <main className="main" ref={mainRef} onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 20)}>
        <TopBar scrolled={scrolled} />
        <div className="page">
          <Outlet />
        </div>
      </main>
      {wide ? <NowPlayingPanel /> : <PlayerBar />}
      {!wide && queueOpen && <QueuePanel />}
      <MobileNav />
      <NowPlaying />
    </div>
  )
}
