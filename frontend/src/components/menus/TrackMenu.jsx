import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Disc3, ExternalLink, Heart, Info, ListPlus, Plus, Trash2, UserRound } from 'lucide-react'
import { getErrorMessage } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useCollection } from '../../context/CollectionContext'
import { useLibrary } from '../../context/LibraryContext'
import { usePlayer } from '../../context/PlayerContext'
import { useToast } from '../../context/ToastContext'

// The "…" / right-click menu for one song
export default function TrackMenu({ x, y, alignRight, track, options, onClose, onShowCredits }) {
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const { addToQueue } = usePlayer()
  const { albumOfTrack } = useLibrary()
  const { isLiked, toggleLike, myPlaylists, createPlaylist, addToPlaylist, removeFromPlaylist } = useCollection()
  const ref = useRef(null)
  const [view, setView] = useState('main') // main | playlists
  const [pos, setPos] = useState({ left: x, top: y, visible: false })

  const album = albumOfTrack.get(track.id)
  const playlist = options.playlist
  const canRemoveFromPlaylist = playlist && playlist.owner.id === user?.id
  const liked = isLiked(track.id)

  // Keep the menu inside the window
  useLayoutEffect(() => {
    const box = ref.current.getBoundingClientRect()
    let left = alignRight ? x - box.width : x
    let top = y
    if (left + box.width > window.innerWidth - 8) left = window.innerWidth - box.width - 8
    if (top + box.height > window.innerHeight - 8) top = Math.max(8, y - box.height - (alignRight ? 40 : 0))
    setPos({ left: Math.max(8, left), top: Math.max(8, top), visible: true })
  }, [x, y, alignRight, view])

  // Close on outside click, Escape, scroll or resize
  useEffect(() => {
    const onDown = (e) => !ref.current?.contains(e.target) && onClose()
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('pointerdown', onDown, true)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onClose)
    document.addEventListener('scroll', onClose, true)
    return () => {
      document.removeEventListener('pointerdown', onDown, true)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onClose)
      document.removeEventListener('scroll', onClose, true)
    }
  }, [onClose])

  useEffect(() => {
    ref.current?.querySelector('button')?.focus()
  }, [view])

  const run = (fn) => () => {
    onClose()
    fn()
  }

  const newPlaylistWithSong = async () => {
    onClose()
    try {
      const created = await createPlaylist({ name: track.title })
      await addToPlaylist(created, track)
    } catch (e) {
      toast.error(getErrorMessage(e, 'Couldn’t create the playlist.'))
    }
  }

  return createPortal(
    <div
      className="ctx-menu"
      role="menu"
      ref={ref}
      style={{ left: pos.left, top: pos.top, visibility: pos.visible ? 'visible' : 'hidden' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {view === 'main' ? (
        <>
          <button type="button" role="menuitem" onClick={() => setView('playlists')}>
            <Plus /> Add to playlist <ChevronRight className="ctx-arrow" />
          </button>
          {canRemoveFromPlaylist && (
            <button type="button" role="menuitem" onClick={run(() => removeFromPlaylist(playlist, track))}>
              <Trash2 /> Remove from this playlist
            </button>
          )}
          <button type="button" role="menuitem" onClick={run(() => toggleLike(track))}>
            <Heart fill={liked ? 'currentColor' : 'none'} className={liked ? 'is-liked' : ''} />
            {liked ? 'Remove from your Liked Songs' : 'Save to your Liked Songs'}
          </button>
          <button type="button" role="menuitem" onClick={run(() => addToQueue(track))}>
            <ListPlus /> Add to queue
          </button>
          <div className="ctx-sep" />
          {track.artists.map((a) => (
            <button key={a.slug} type="button" role="menuitem" onClick={run(() => navigate(`/artist/${a.slug}`))}>
              <UserRound /> {track.artists.length > 1 ? `Go to ${a.name}` : 'Go to artist'}
            </button>
          ))}
          {album && (
            <button type="button" role="menuitem" onClick={run(() => navigate(`/album/${album.id}`))}>
              <Disc3 /> Go to album
            </button>
          )}
          <button type="button" role="menuitem" onClick={run(() => onShowCredits(track))}>
            <Info /> Show credits
          </button>
          {track.externalUrl && (
            <button type="button" role="menuitem" onClick={run(() => window.open(track.externalUrl, '_blank', 'noopener,noreferrer'))}>
              <ExternalLink /> Listen on Apple Music
            </button>
          )}
        </>
      ) : (
        <>
          <button type="button" className="ctx-back" onClick={() => setView('main')}>
            <ArrowLeft /> Add to playlist
          </button>
          <div className="ctx-sep" />
          <button type="button" role="menuitem" onClick={newPlaylistWithSong}>
            <Plus /> New playlist
          </button>
          {myPlaylists.length > 0 && <div className="ctx-sep" />}
          <div className="ctx-scroll">
            {myPlaylists.map((p) => (
              <button key={p.id} type="button" role="menuitem" onClick={run(() => addToPlaylist(p, track))}>
                <span className="ctx-text">{p.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>,
    document.body,
  )
}
