import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getErrorMessage, meApi, playlistApi } from '../api/client'
import { useAuth } from './AuthContext'
import { useLibrary } from './LibraryContext'
import { useToast } from './ToastContext'

const CollectionContext = createContext(null)

// Everything personal: Liked Songs, playlists and Recently played
export function CollectionProvider({ children }) {
  const { user } = useAuth()
  const { bumpPlays } = useLibrary()
  const toast = useToast()
  const [likedTracks, setLikedTracks] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [recent, setRecent] = useState([])
  const [ready, setReady] = useState(false)

  const refresh = useCallback(async () => {
    const [likes, lists, history] = await Promise.allSettled([meApi.likes(), playlistApi.list(), meApi.history()])
    if (likes.status === 'fulfilled') setLikedTracks(likes.value)
    if (lists.status === 'fulfilled') setPlaylists(lists.value)
    if (history.status === 'fulfilled') setRecent(history.value)
    setReady(true)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const likedIds = useMemo(() => new Set(likedTracks.map((t) => t.id)), [likedTracks])
  const isLiked = useCallback((id) => likedIds.has(id), [likedIds])

  // Optimistic: the heart changes instantly, and is put back if the server says no
  const toggleLike = useCallback(
    async (track) => {
      const wasLiked = likedIds.has(track.id)
      setLikedTracks((list) => (wasLiked ? list.filter((t) => t.id !== track.id) : [track, ...list]))
      try {
        if (wasLiked) await meApi.unlike(track.id)
        else await meApi.like(track.id)
        toast.success(wasLiked ? 'Removed from Liked Songs' : 'Added to Liked Songs')
      } catch (e) {
        setLikedTracks((list) => (wasLiked ? [track, ...list] : list.filter((t) => t.id !== track.id)))
        toast.error(getErrorMessage(e, 'Couldn’t update Liked Songs.'))
      }
    },
    [likedIds, toast],
  )

  const replacePlaylist = useCallback((updated) => {
    setPlaylists((list) => {
      const exists = list.some((p) => p.id === updated.id)
      return exists ? list.map((p) => (p.id === updated.id ? updated : p)) : [updated, ...list]
    })
    return updated
  }, [])

  const createPlaylist = useCallback(
    async (data = {}) => {
      const playlist = await playlistApi.create(data)
      replacePlaylist(playlist)
      return playlist
    },
    [replacePlaylist],
  )

  const updatePlaylist = useCallback(
    async (id, data) => replacePlaylist(await playlistApi.update(id, data)),
    [replacePlaylist],
  )

  const deletePlaylist = useCallback(async (id) => {
    await playlistApi.remove(id)
    setPlaylists((list) => list.filter((p) => p.id !== id))
  }, [])

  const addToPlaylist = useCallback(
    async (playlist, track) => {
      try {
        replacePlaylist(await playlistApi.addTrack(playlist.id, track.id))
        toast.success(`Added to ${playlist.name}`)
      } catch (e) {
        toast.error(getErrorMessage(e, 'Couldn’t add the song.'))
      }
    },
    [replacePlaylist, toast],
  )

  const removeFromPlaylist = useCallback(
    async (playlist, track) => {
      try {
        replacePlaylist(await playlistApi.removeTrack(playlist.id, track.id))
        toast.success(`Removed from ${playlist.name}`)
      } catch (e) {
        toast.error(getErrorMessage(e, 'Couldn’t remove the song.'))
      }
    },
    [replacePlaylist, toast],
  )

  // Called by the player once a song has really been listened to
  const recordPlay = useCallback(
    (track) => {
      setRecent((list) => [track, ...list.filter((t) => t.id !== track.id)].slice(0, 30))
      bumpPlays(track.id)
      meApi.recordPlay(track.id).catch(() => {})
    },
    [bumpPlays],
  )

  const myPlaylists = useMemo(() => playlists.filter((p) => p.owner.id === user?.id), [playlists, user])

  const value = useMemo(
    () => ({
      ready,
      likedTracks,
      isLiked,
      toggleLike,
      playlists,
      myPlaylists,
      createPlaylist,
      updatePlaylist,
      deletePlaylist,
      addToPlaylist,
      removeFromPlaylist,
      replacePlaylist,
      recent,
      recordPlay,
      refresh,
    }),
    [
      ready, likedTracks, isLiked, toggleLike, playlists, myPlaylists, createPlaylist, updatePlaylist,
      deletePlaylist, addToPlaylist, removeFromPlaylist, replacePlaylist, recent, recordPlay, refresh,
    ],
  )

  return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>
}

export function useCollection() {
  return useContext(CollectionContext)
}
