import axios from 'axios'
import { sharedByline, splitArtists } from '../utils/artists'

// All requests go to /api (Vite proxies it to Express in development).
// withCredentials makes the browser send the HTTP-only "token" cookie.
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const message = error?.response?.data?.message
  if (message) return message
  if (error?.code === 'ERR_NETWORK' || (error?.request && !error?.response)) {
    return "Can't reach the Beat Flow server. Make sure the backend is running."
  }
  if (error?.response?.status >= 500) {
    return 'The server had a problem. Please try again in a moment.'
  }
  return fallback
}

/* ---------- Shape the backend data into what the UI needs ---------- */

function normalizeUser(user) {
  if (user && typeof user === 'object') {
    return { id: user._id ?? user.id ?? null, username: user.username || 'Unknown' }
  }
  return { id: user ?? null, username: 'Unknown' }
}

export function normalizeTrack(music) {
  const artist = normalizeUser(music.artist) // the account that uploaded it
  const byline = music.artistName || artist.username
  return {
    id: music._id ?? music.id,
    title: music.title,
    uri: music.uri,
    artist,
    byline, // the artist name(s) shown under the title
    artists: splitArtists(byline), // [{ name, slug }] for links to artist pages
    coverUrl: music.coverUrl || '',
    duration: Number.isFinite(music.duration) ? music.duration : null,
    genre: music.genre || '',
    plays: music.plays || 0,
    credits: music.credits || '',
    isPreview: Boolean(music.isPreview), // official 30-second preview (Apple Music)
    externalUrl: music.externalUrl || '', // where to hear the full song
    albumName: music.albumName || '',
    releaseYear: music.releaseYear || null,
  }
}

const isPopulated = (m) => m && typeof m === 'object' && m.uri

export function normalizeAlbum(album) {
  const artist = normalizeUser(album.artist)
  const tracks = (album.musics || []).filter(isPopulated).map(normalizeTrack)
  return {
    id: album._id ?? album.id,
    title: album.title,
    coverUrl: album.coverUrl || '',
    artist, // uploader account (owner)
    byline: sharedByline(tracks, artist.username),
    tracks,
  }
}

export function normalizePlaylist(playlist) {
  const owner = normalizeUser(playlist.owner)
  return {
    id: playlist._id ?? playlist.id,
    name: playlist.name,
    description: playlist.description || '',
    coverUrl: playlist.coverUrl || '',
    owner,
    curator: playlist.curator || '',
    madeBy: playlist.curator || owner.username,
    tracks: (playlist.tracks || []).filter(isPopulated).map(normalizeTrack),
    updatedAt: playlist.updatedAt,
  }
}

// Sends JSON normally, or form-data when a picture is attached
function body(fields, cover) {
  if (!cover) return fields
  const form = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) form.append(key, typeof value === 'string' ? value : JSON.stringify(value))
  }
  form.append('cover', cover)
  return form
}

/* ---------- Auth ---------- */

export const authApi = {
  me: () => api.get('/auth/me').then((r) => r.data.user),

  // The login field accepts a username or an email
  login: (identifier, password) => {
    const value = identifier.trim()
    const data = value.includes('@') ? { email: value, password } : { username: value, password }
    return api.post('/auth/login', data).then((r) => r.data.user)
  },

  register: ({ username, email, password, role }) =>
    api.post('/auth/register', { username, email, password, role }).then((r) => r.data.user),

  logout: () => api.post('/auth/logout'),

  // "Continue as guest": a temporary account, no sign-up needed
  guest: () => api.post('/auth/guest').then((r) => r.data.user),

  // Public: a few album covers + numbers for the login page
  highlights: () => api.get('/public/highlights').then((r) => r.data),
}

/* ---------- Songs & albums ---------- */

export const musicApi = {
  tracks: () =>
    api.get('/music', { params: { limit: 200 } }).then((r) => r.data.musics.map(normalizeTrack)),

  albums: () => api.get('/music/albums').then((r) => r.data.albums.map(normalizeAlbum)),

  album: (id) => api.get(`/music/albums/${id}`).then((r) => normalizeAlbum(r.data.album)),

  // cover is optional — without it the server uses the picture inside the song file
  upload: ({ file, title, genre, cover }, onProgress) => {
    const form = new FormData()
    form.append('title', title)
    if (genre) form.append('genre', genre)
    form.append('music', file)
    if (cover) form.append('cover', cover)
    return api
      .post('/music/upload', form, {
        onUploadProgress: (e) => {
          if (e.total) onProgress?.(Math.round((e.loaded * 100) / e.total))
        },
      })
      .then((r) => r.data.music)
  },

  updateTrack: (id, { title, genre, cover }) =>
    api.patch(`/music/${id}`, body({ title, genre }, cover)).then((r) => normalizeTrack(r.data.music)),

  deleteTrack: (id) => api.delete(`/music/${id}`),

  createAlbum: ({ title, musics, cover }) => api.post('/music/album', body({ title, musics }, cover)).then((r) => r.data.album),

  updateAlbum: (id, { title, cover }) =>
    api.patch(`/music/albums/${id}`, body({ title }, cover)).then((r) => normalizeAlbum(r.data.album)),

  deleteAlbum: (id) => api.delete(`/music/albums/${id}`),
}

/* ---------- Your stuff: likes & history ---------- */

export const meApi = {
  likes: () => api.get('/me/likes').then((r) => r.data.tracks.map(normalizeTrack)),
  like: (trackId) => api.put(`/me/likes/${trackId}`),
  unlike: (trackId) => api.delete(`/me/likes/${trackId}`),
  history: () => api.get('/me/history').then((r) => r.data.tracks.map(normalizeTrack)),
  recordPlay: (trackId) => api.post(`/me/history/${trackId}`),
}

/* ---------- Playlists ---------- */

export const playlistApi = {
  list: () => api.get('/playlists').then((r) => r.data.playlists.map(normalizePlaylist)),
  get: (id) => api.get(`/playlists/${id}`).then((r) => normalizePlaylist(r.data.playlist)),
  create: ({ name, description, cover } = {}) =>
    api.post('/playlists', body({ name, description }, cover)).then((r) => normalizePlaylist(r.data.playlist)),
  update: (id, { name, description, cover }) =>
    api.patch(`/playlists/${id}`, body({ name, description }, cover)).then((r) => normalizePlaylist(r.data.playlist)),
  remove: (id) => api.delete(`/playlists/${id}`),
  addTrack: (id, trackId) =>
    api.post(`/playlists/${id}/tracks`, { trackId }).then((r) => normalizePlaylist(r.data.playlist)),
  removeTrack: (id, trackId) =>
    api.delete(`/playlists/${id}/tracks/${trackId}`).then((r) => normalizePlaylist(r.data.playlist)),
}
