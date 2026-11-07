import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { rememberDuration } from '../hooks/useTrackDuration'
import { imageUrl } from '../utils/cover'
import { rememberContext } from '../utils/recentContexts'
import { useAuth } from './AuthContext'
import { useCollection } from './CollectionContext'
import { useLibrary } from './LibraryContext'
import { useToast } from './ToastContext'

// Two contexts: progress changes ~4x per second, so only the player bar
// listens to it. Everything else (track lists, cards) uses PlayerContext.
const PlayerContext = createContext(null)
const ProgressContext = createContext({ currentTime: 0, duration: 0 })

const VOLUME_KEY = 'beatflow:volume'
const LISTEN_SECONDS = 10 // a play counts after this long

function readVolume() {
  try {
    const v = parseFloat(localStorage.getItem(VOLUME_KEY))
    return Number.isFinite(v) ? Math.min(Math.max(v, 0), 1) : 0.8
  } catch {
    return 0.8
  }
}

function randomOther(length, exclude) {
  let i = exclude
  while (i === exclude) i = Math.floor(Math.random() * length)
  return i
}

export function PlayerProvider({ children }) {
  const toast = useToast()
  const { user } = useAuth()
  const { tracks: catalog, status: libraryStatus } = useLibrary()
  const { recordPlay } = useCollection()

  const audioRef = useRef(null)
  if (audioRef.current === null) audioRef.current = new Audio()

  // What's playing: a list (album, playlist…) + position in it,
  // plus songs added with "Add to queue", which play before the list continues.
  const [queue, setQueue] = useState([])
  const [index, setIndex] = useState(-1)
  const [manual, setManual] = useState([])
  const [manualCurrent, setManualCurrent] = useState(null)
  const [seq, setSeq] = useState(0) // bumps on every song change → the audio (re)loads
  const [context, setContext] = useState(null) // { id, label } of the list playing

  const [isPlaying, setIsPlaying] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(readVolume)
  const [muted, setMuted] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState('off') // off | all | one
  const [expanded, setExpanded] = useState(false) // full-screen view
  const [queueOpen, setQueueOpen] = useState(false) // side panel

  const current = manualCurrent ?? (index >= 0 ? (queue[index] ?? null) : null)
  const currentId = current?.id ?? null

  const autoplayRef = useRef(true)
  const resumeAtRef = useRef(0)
  const listenRef = useRef(null) // { id, counted } for the song that's loaded

  // Audio event handlers read the latest state through this ref
  const stateRef = useRef({})
  useEffect(() => {
    stateRef.current = { queue, index, manual, manualCurrent, shuffle, repeat, current }
  })

  const restart = useCallback(() => {
    const audio = audioRef.current
    audio.currentTime = 0
    audio.play().catch(() => {})
  }, [])

  const loadAt = useCallback((i) => {
    setManualCurrent(null)
    setIndex(i)
    setSeq((s) => s + 1)
  }, [])

  const next = useCallback(
    (fromEnded = false) => {
      const { queue: q, index: i, manual: m, shuffle: sh, repeat: rp } = stateRef.current
      if (m.length) {
        setManualCurrent(m[0])
        setManual(m.slice(1))
        setSeq((s) => s + 1)
        return
      }
      if (!q.length) return
      if (sh && q.length > 1) return loadAt(randomOther(q.length, i))
      if (i < q.length - 1) return loadAt(i + 1)
      if (fromEnded === true && rp !== 'all') {
        // End of the list: stop, ready to play again from the start of this song
        audioRef.current.currentTime = 0
        setIsPlaying(false)
        return
      }
      loadAt(0)
    },
    [loadAt],
  )

  const prev = useCallback(() => {
    const { index: i, manualCurrent: mc, queue: q } = stateRef.current
    if (audioRef.current.currentTime > 3) return restart()
    if (mc && q.length) {
      setManualCurrent(null) // back to the list song we were on before the queue
      setSeq((s) => s + 1)
      return
    }
    if (i > 0) return loadAt(i - 1)
    restart()
  }, [loadAt, restart])

  const handlersRef = useRef({})
  useEffect(() => {
    handlersRef.current = {
      onEnded: () => (stateRef.current.repeat === 'one' ? restart() : next(true)),
      onError: () => toast.error("This song couldn't be played. Try another one."),
      onListened: () => current && recordPlay(current),
    }
  })

  // Wire up the <audio> element once
  useEffect(() => {
    const audio = audioRef.current
    const onMeta = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
      rememberDuration(stateRef.current.current?.uri, audio.duration)
      if (resumeAtRef.current) {
        audio.currentTime = resumeAtRef.current
        setCurrentTime(resumeAtRef.current)
        resumeAtRef.current = 0
      }
    }
    const onTime = () => {
      setCurrentTime(audio.currentTime)
      const listen = listenRef.current
      const needed = Math.min(LISTEN_SECONDS, (audio.duration || 40) / 2)
      if (listen && !listen.counted && !audio.paused && audio.currentTime >= needed) {
        listen.counted = true
        handlersRef.current.onListened()
      }
    }
    const events = {
      timeupdate: onTime,
      loadedmetadata: onMeta,
      durationchange: onMeta,
      play: () => setIsPlaying(true),
      pause: () => setIsPlaying(false),
      waiting: () => setIsBuffering(true),
      playing: () => setIsBuffering(false),
      canplay: () => setIsBuffering(false),
      ended: () => handlersRef.current.onEnded(),
      error: () => {
        setIsBuffering(false)
        setIsPlaying(false)
        if (audio.getAttribute('src')) handlersRef.current.onError()
      },
    }
    for (const [name, fn] of Object.entries(events)) audio.addEventListener(name, fn)
    return () => {
      for (const [name, fn] of Object.entries(events)) audio.removeEventListener(name, fn)
      audio.pause()
    }
  }, [])

  // Load (and usually play) whenever the song changes
  useEffect(() => {
    if (!current) return
    const audio = audioRef.current
    audio.src = current.uri
    listenRef.current = { id: current.id, counted: false }
    setCurrentTime(0)
    setDuration(0)
    if (!autoplayRef.current) {
      autoplayRef.current = true // only the restored song starts paused
      return
    }
    setIsBuffering(true)
    audio.play().catch((err) => {
      if (err.name !== 'AbortError') {
        setIsBuffering(false)
        setIsPlaying(false)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seq])

  useEffect(() => {
    audioRef.current.volume = volume
    try {
      localStorage.setItem(VOLUME_KEY, String(volume))
    } catch {
      /* storage unavailable (private mode) — volume just won't be remembered */
    }
  }, [volume])

  useEffect(() => {
    audioRef.current.muted = muted
  }, [muted])

  /* ---------- Remember the last song, like a real streaming app ---------- */

  const resumeKey = user ? `beatflow:last:${user.id}` : null

  useEffect(() => {
    if (!current || !resumeKey) return undefined
    const save = () => {
      try {
        localStorage.setItem(
          resumeKey,
          JSON.stringify({
            trackId: current.id,
            queueIds: stateRef.current.queue.slice(0, 300).map((t) => t.id),
            time: audioRef.current.currentTime || 0,
            context: context || null,
          }),
        )
      } catch {
        /* storage unavailable */
      }
    }
    save()
    const timer = setInterval(save, 5000)
    window.addEventListener('pagehide', save)
    return () => {
      clearInterval(timer)
      window.removeEventListener('pagehide', save)
      save()
    }
  }, [current, context, resumeKey])

  const restoredRef = useRef(false)
  useEffect(() => {
    if (restoredRef.current || libraryStatus !== 'ready' || !resumeKey) return
    restoredRef.current = true
    if (stateRef.current.current) return
    let saved = null
    try {
      saved = JSON.parse(localStorage.getItem(resumeKey))
    } catch {
      saved = null
    }
    if (!saved?.trackId) return
    // Rebuild the same list from the catalogue (songs deleted since are skipped)
    const byId = new Map(catalog.map((t) => [t.id, t]))
    let list = (saved.queueIds || []).map((id) => byId.get(id)).filter(Boolean)
    if (!list.some((t) => t.id === saved.trackId)) list = catalog
    const at = list.findIndex((t) => t.id === saved.trackId)
    if (at === -1) return
    autoplayRef.current = false
    resumeAtRef.current = Number(saved.time) || 0
    setQueue(list)
    setIndex(at)
    setContext(saved.context || { id: 'resume', label: 'Beat Flow' })
    setSeq((s) => s + 1)
  }, [libraryStatus, catalog, resumeKey])

  /* ---------- Public controls ---------- */

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio.getAttribute('src')) return
    if (audio.paused) audio.play().catch(() => {})
    else audio.pause()
  }, [])

  const userIdRef = useRef(null)
  useEffect(() => {
    userIdRef.current = user?.id ?? null
  })

  const playTracks = useCallback((tracks, startIndex = 0, ctx = null) => {
    if (!tracks?.length) return
    rememberContext(userIdRef.current, ctx) // for "Recently Played" on Home
    setQueue(tracks)
    setContext(ctx)
    setManualCurrent(null)
    setIndex(Math.min(Math.max(startIndex, 0), tracks.length - 1))
    setSeq((s) => s + 1)
  }, [])

  const shufflePlay = useCallback(
    (tracks, ctx = null) => {
      if (!tracks?.length) return
      setShuffle(true)
      playTracks(tracks, Math.floor(Math.random() * tracks.length), ctx)
    },
    [playTracks],
  )

  const addToQueue = useCallback(
    (track) => {
      if (!stateRef.current.current) {
        playTracks([track], 0, { id: 'queue', label: 'Your queue' })
        return
      }
      setManual((m) => [...m, track])
      toast.success('Added to queue')
    },
    [playTracks, toast],
  )

  const playFromQueue = useCallback((k) => {
    const m = stateRef.current.manual
    if (!m[k]) return
    setManualCurrent(m[k])
    setManual(m.slice(k + 1))
    setSeq((s) => s + 1)
  }, [])

  const removeFromQueue = useCallback((k) => setManual((m) => m.filter((_, i) => i !== k)), [])
  const clearQueue = useCallback(() => setManual([]), [])

  const seek = useCallback((time) => {
    if (!Number.isFinite(time)) return
    audioRef.current.currentTime = time
    setCurrentTime(time)
  }, [])

  const setVolume = useCallback((v) => {
    const value = Math.min(Math.max(v, 0), 1)
    setVolumeState(value)
    if (value > 0) setMuted(false)
  }, [])

  const toggleMute = useCallback(() => setMuted((m) => !m), [])
  const toggleShuffle = useCallback(() => setShuffle((s) => !s), [])
  const toggleQueue = useCallback(() => setQueueOpen((o) => !o), [])
  const cycleRepeat = useCallback(
    () => setRepeat((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off')),
    [],
  )

  /* ---------- Nice extras ---------- */

  // Lock-screen / headphone / keyboard media keys
  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.metadata = current
      ? new MediaMetadata({
          title: current.title,
          artist: current.byline,
          album: context?.label ?? 'Beat Flow',
          artwork: current.coverUrl
            ? [256, 512].map((s) => ({ src: imageUrl(current.coverUrl, s), sizes: `${s}x${s}`, type: 'image/jpeg' }))
            : [],
        })
      : null
  }, [current, context])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return undefined
    const ms = navigator.mediaSession
    const handlers = {
      play: () => audioRef.current.play().catch(() => {}),
      pause: () => audioRef.current.pause(),
      previoustrack: prev,
      nexttrack: () => next(),
      seekto: (d) => seek(d.seekTime),
    }
    for (const [action, fn] of Object.entries(handlers)) {
      try {
        ms.setActionHandler(action, fn)
      } catch {
        /* action not supported by this browser */
      }
    }
    return () => {
      for (const action of Object.keys(handlers)) {
        try {
          ms.setActionHandler(action, null)
        } catch {
          /* ignore */
        }
      }
    }
  }, [prev, next, seek])

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = current ? (isPlaying ? 'playing' : 'paused') : 'none'
    }
  }, [current, isPlaying])

  // Space bar = play / pause (unless you're typing or on a button)
  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== 'Space' || e.repeat) return
      if (e.target.closest?.('input, textarea, select, button, a, [contenteditable="true"]')) return
      e.preventDefault()
      togglePlay()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePlay])

  // Show the playing song in the browser tab
  useEffect(() => {
    document.title = current && isPlaying ? `${current.title} · ${current.byline}` : 'Beat Flow'
    return () => {
      document.title = 'Beat Flow'
    }
  }, [current, isPlaying])

  const upNext = useMemo(
    () => ({
      manual,
      fromList: queue.map((t, i) => ({ track: t, index: i })).slice(index + 1),
    }),
    [manual, queue, index],
  )

  const value = useMemo(
    () => ({
      current,
      currentId,
      queue,
      index,
      upNext,
      context,
      isPlaying,
      isBuffering,
      volume,
      muted,
      shuffle,
      repeat,
      expanded,
      setExpanded,
      queueOpen,
      setQueueOpen,
      toggleQueue,
      playTracks,
      shufflePlay,
      togglePlay,
      next,
      prev,
      jumpTo: loadAt,
      addToQueue,
      playFromQueue,
      removeFromQueue,
      clearQueue,
      seek,
      setVolume,
      toggleMute,
      toggleShuffle,
      cycleRepeat,
    }),
    [
      current, currentId, queue, index, upNext, context, isPlaying, isBuffering, volume, muted, shuffle,
      repeat, expanded, queueOpen, toggleQueue, playTracks, shufflePlay, togglePlay, next, prev, loadAt,
      addToQueue, playFromQueue, removeFromQueue, clearQueue, seek, setVolume, toggleMute, toggleShuffle,
      cycleRepeat,
    ],
  )

  const progress = useMemo(() => ({ currentTime, duration }), [currentTime, duration])

  return (
    <PlayerContext.Provider value={value}>
      <ProgressContext.Provider value={progress}>{children}</ProgressContext.Provider>
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  return useContext(PlayerContext)
}

export function usePlayerProgress() {
  return useContext(ProgressContext)
}
