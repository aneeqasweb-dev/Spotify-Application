import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { usePlayer } from '../../context/PlayerContext'
import NowPlaying from '../player/NowPlaying'
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

  // New page → start at the top
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className={`app-shell${queueOpen ? ' has-queue' : ''}`}>
      <Sidebar />
      <main className="main" ref={mainRef} onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 40)}>
        <TopBar scrolled={scrolled} />
        <div className="page">
          <Outlet />
        </div>
      </main>
      {queueOpen && <QueuePanel />}
      <PlayerBar />
      <MobileNav />
      <NowPlaying />
    </div>
  )
}
