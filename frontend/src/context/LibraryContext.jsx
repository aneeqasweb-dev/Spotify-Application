import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getErrorMessage, musicApi } from '../api/client'
import { buildArtists, slugify } from '../utils/artists'

const LibraryContext = createContext(null)

// The whole catalogue: every song and album, plus artists and genres built from them
export function LibraryProvider({ children }) {
  const [tracks, setTracks] = useState([])
  const [albums, setAlbums] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    try {
      const [t, a] = await Promise.all([musicApi.tracks(), musicApi.albums()])
      setTracks(t)
      setAlbums(a)
      setError(null)
      setStatus('ready')
    } catch (e) {
      setError(getErrorMessage(e, "Couldn't load the music."))
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Keep the play count on screen in sync after a play is recorded
  const bumpPlays = useCallback((trackId) => {
    setTracks((list) => list.map((t) => (t.id === trackId ? { ...t, plays: t.plays + 1 } : t)))
  }, [])

  const artists = useMemo(() => buildArtists(tracks), [tracks])

  const genres = useMemo(() => {
    const map = new Map()
    for (const t of tracks) {
      if (!t.genre) continue
      const slug = slugify(t.genre)
      const entry = map.get(slug) ?? { slug, name: t.genre, tracks: [] }
      entry.tracks.push(t)
      map.set(slug, entry)
    }
    return [...map.values()].sort((a, b) => b.tracks.length - a.tracks.length)
  }, [tracks])

  // Which album each song belongs to (for the "Album" column and "Go to album")
  const albumOfTrack = useMemo(() => {
    const map = new Map()
    for (const album of albums) {
      for (const t of album.tracks) if (!map.has(t.id)) map.set(t.id, album)
    }
    return map
  }, [albums])

  const value = useMemo(
    () => ({ tracks, albums, artists, genres, albumOfTrack, status, error, refresh, bumpPlays }),
    [tracks, albums, artists, genres, albumOfTrack, status, error, refresh, bumpPlays],
  )

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary() {
  return useContext(LibraryContext)
}
