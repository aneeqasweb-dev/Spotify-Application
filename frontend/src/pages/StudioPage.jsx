import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Camera, CircleAlert, CloudUpload, Disc3, FileAudio, Headphones, ImagePlus, ListMusic, LoaderCircle, Mic, Music2,
  Pencil, Plus, RotateCcw, Sparkles, Trash2, Upload, X,
} from 'lucide-react'
import { getErrorMessage, musicApi } from '../api/client'
import AlbumArt from '../components/music/AlbumArt'
import Cover from '../components/music/Cover'
import EditDetailsModal from '../components/music/EditDetailsModal'
import EmptyState from '../components/ui/EmptyState'
import { ConfirmModal } from '../components/ui/Modal'
import PageWash from '../components/ui/PageWash'
import Section from '../components/ui/Section'
import { useAuth } from '../context/AuthContext'
import { useCollection } from '../context/CollectionContext'
import { useLibrary } from '../context/LibraryContext'
import { usePlayer } from '../context/PlayerContext'
import { useToast } from '../context/ToastContext'
import { useObjectUrl } from '../hooks/useObjectUrl'
import { dateFromId, formatBytes, formatTime, plural, timeAgo, titleFromFileName } from '../utils/format'

const MAX_BYTES = 25 * 1024 * 1024
const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const MY_UPLOADS = { id: 'studio', label: 'Your uploads' }
const GENRES = ['Pop', 'Hip-Hop', 'R&B', 'Rock', 'Electronica', 'Dance', 'Jazz', 'Funk', 'Blues', 'Latin', 'Soundtrack', 'Classical', 'Indie', 'K-Pop', 'Lo-fi']

// Read the title / artist / length / picture stored inside a song file, in the browser.
// The library is only downloaded when an artist actually picks a file.
async function readTags(file) {
  try {
    const { parseBlob } = await import('music-metadata')
    const meta = await parseBlob(file)
    const pic = meta.common.picture?.[0]
    return {
      title: meta.common.title?.trim() || '',
      artist: meta.common.artist?.trim() || '',
      duration: meta.format.duration,
      genre: meta.common.genre?.[0]?.trim() || '',
      picture: pic ? new Blob([pic.data], { type: pic.format }) : null,
    }
  } catch {
    return null
  }
}

export default function StudioPage() {
  const { user, isArtist } = useAuth()
  const { tracks, albums } = useLibrary()

  if (!isArtist) {
    return (
      <EmptyState
        icon={Mic}
        title="The Studio is for artists"
        action={
          <Link to="/" className="btn btn-ghost">
            Back to Home
          </Link>
        }
      >
        You’re signed in with a listener account. To upload songs and release albums, create a separate artist account.
      </EmptyState>
    )
  }

  const myTracks = tracks.filter((t) => t.artist.id === user.id)
  const myAlbums = albums.filter((a) => a.artist.id === user.id)
  const totalPlays = myTracks.reduce((n, t) => n + t.plays, 0)

  return (
    <>
      <PageWash color="#1f5fd0" />
      <header className="page-header">
        <span className="eyebrow">Artist Studio</span>
        <h1 className="page-title">Share your sound</h1>
        <p className="lede">Upload songs and package them into albums. Cover pictures are added automatically.</p>
      </header>

      <div className="stat-grid">
        <Stat icon={Music2} label="Songs published" value={myTracks.length} />
        <Stat icon={Disc3} label="Albums released" value={myAlbums.length} />
        <Stat icon={Headphones} label="Total plays" value={totalPlays.toLocaleString()} />
        <Stat
          icon={Sparkles}
          label="Latest upload"
          value={myTracks[0] ? timeAgo(dateFromId(myTracks[0].id)) : '—'}
          small
        />
      </div>

      <div className="studio-grid">
        <UploadPanel />
        <AlbumPanel tracks={myTracks} />
      </div>

      <ManageSongs tracks={myTracks} />
      <ManageAlbums albums={myAlbums} />
    </>
  )
}

function Stat({ icon: Icon, label, value, small }) {
  return (
    <div className="stat">
      <span className="stat-icon">
        <Icon />
      </span>
      <span className={`stat-value${small ? ' is-small' : ''}`}>{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

/* ---------- Upload a song ---------- */

function UploadPanel() {
  const toast = useToast()
  const { refresh } = useLibrary()
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [tags, setTags] = useState(null) // what we found inside the file
  const [reading, setReading] = useState(false)
  const [title, setTitle] = useState('')
  const [titleEdited, setTitleEdited] = useState(false)
  const [genre, setGenre] = useState('')
  const [customCover, setCustomCover] = useState(null) // picture chosen by the artist
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState('idle') // idle | uploading | processing
  const [error, setError] = useState('')
  const busy = stage !== 'idle'

  const embeddedUrl = useObjectUrl(tags?.picture)
  const customUrl = useObjectUrl(customCover)
  const previewUrl = customUrl || embeddedUrl

  const pick = async (f) => {
    if (!f) return
    if (!f.type.startsWith('audio/')) return setError('That file isn’t audio. Choose an MP3, WAV, M4A, FLAC or OGG file.')
    if (f.size > MAX_BYTES) return setError(`That file is ${formatBytes(f.size)} — the limit is 25 MB.`)
    setError('')
    setFile(f)
    setTags(null)
    if (!titleEdited) setTitle(titleFromFileName(f.name))

    setReading(true)
    const found = await readTags(f)
    setReading(false)
    setTags(found)
    if (found?.title && !titleEdited) setTitle(found.title)
    if (found?.genre) setGenre((g) => g || found.genre)
  }

  const pickCover = (f) => {
    if (!f) return
    if (!f.type.startsWith('image/')) return setError('The picture must be an image (JPG, PNG or WebP).')
    if (f.size > MAX_IMAGE_BYTES) return setError('That picture is over 8 MB. Please choose a smaller one.')
    setError('')
    setCustomCover(f)
  }

  const reset = () => {
    setFile(null)
    setTags(null)
    setTitle('')
    setTitleEdited(false)
    setGenre('')
    setCustomCover(null)
    setProgress(0)
    setStage('idle')
    if (inputRef.current) inputRef.current.value = ''
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!file) return setError('Choose a song file first.')
    if (!title.trim()) return setError('Give your song a title.')

    setError('')
    setProgress(0)
    setStage('uploading')
    try {
      await musicApi.upload({ file, title: title.trim(), genre: genre.trim(), cover: customCover }, (p) => {
        setProgress(p)
        if (p >= 100) setStage('processing') // file reached our server; now it goes to ImageKit
      })
      toast.success(`“${title.trim()}” is live on Beat Flow`)
      reset()
      refresh()
    } catch (err) {
      setError(getErrorMessage(err, 'Upload failed. Please try again.'))
      setStage('idle')
    }
  }

  const pictureNote = customCover
    ? 'Using your picture'
    : tags?.picture
      ? 'Picture found inside the song'
      : reading
        ? 'Looking for a picture…'
        : 'No picture in this file — add one, or we’ll generate artwork'

  return (
    <section className="panel" aria-labelledby="upload-heading">
      <div className="panel-head">
        <span className="panel-icon">
          <CloudUpload />
        </span>
        <div>
          <h2 id="upload-heading">Upload a song</h2>
          <p>MP3, WAV, M4A, FLAC or OGG · up to 25 MB</p>
        </div>
      </div>

      <form className="stack" onSubmit={submit}>
        {!file ? (
          <label
            className={`dropzone${dragging ? ' is-dragging' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              pick(e.dataTransfer.files?.[0])
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="audio/*"
              className="sr-only"
              onChange={(e) => pick(e.target.files?.[0])}
            />
            <span className="dropzone-icon">
              <Upload />
            </span>
            <strong>Drag &amp; drop your song here</strong>
            <span>
              or <u>browse your files</u>
            </span>
          </label>
        ) : (
          <div className="upload-preview">
            <div className="upload-cover">
              {previewUrl ? (
                <img src={previewUrl} alt="Song cover preview" />
              ) : (
                <span className="upload-cover-empty">
                  {reading ? <LoaderCircle className="spin" /> : <ImagePlus />}
                </span>
              )}
              {!busy && (
                <label className="upload-cover-change" title="Choose a picture">
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      pickCover(e.target.files?.[0])
                      e.target.value = ''
                    }}
                  />
                  <Camera /> {previewUrl ? 'Change' : 'Add picture'}
                </label>
              )}
            </div>

            <div className="upload-info">
              <div className="file-chip">
                <span className="file-chip-icon">
                  <FileAudio />
                </span>
                <span className="file-chip-text">
                  <strong>{file.name}</strong>
                  <span>
                    {formatBytes(file.size)}
                    {tags?.duration ? ` · ${formatTime(tags.duration)}` : ''}
                  </span>
                </span>
                {!busy && (
                  <button type="button" className="icon-btn" onClick={reset} aria-label="Remove file">
                    <X />
                  </button>
                )}
              </div>
              {tags?.artist && (
                <p className="upload-found">
                  Artist in file: <strong>{tags.artist}</strong>
                </p>
              )}
              <p className="upload-found">
                {pictureNote}
                {customCover && tags?.picture && !busy && (
                  <button type="button" className="link-btn" onClick={() => setCustomCover(null)}>
                    <RotateCcw size={13} /> Use the song’s picture
                  </button>
                )}
              </p>
            </div>
          </div>
        )}

        <div className="field">
          <label htmlFor="track-title">Song title</label>
          <input
            id="track-title"
            className="input input-plain"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setTitleEdited(true)
            }}
            placeholder="e.g. Midnight Drive"
            maxLength={120}
            disabled={busy}
          />
        </div>

        <div className="field">
          <label htmlFor="track-genre">
            Genre <span className="muted">(optional — helps listeners find it)</span>
          </label>
          <input
            id="track-genre"
            className="input input-plain"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder="e.g. Pop"
            maxLength={40}
            list="genre-options"
            disabled={busy}
          />
          <GenreOptions />
        </div>

        {busy && (
          <div className="upload-progress" aria-live="polite">
            <div className="upload-progress-top">
              <span>{stage === 'processing' ? 'Publishing to Beat Flow…' : 'Uploading…'}</span>
              {stage === 'uploading' && <span>{progress}%</span>}
            </div>
            <div className={`progress${stage === 'processing' ? ' is-indeterminate' : ''}`}>
              <div className="progress-bar" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {error && (
          <div className="form-error" role="alert">
            <CircleAlert />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={busy || !file}>
          {busy ? (
            <>
              <LoaderCircle className="spin" /> Publishing…
            </>
          ) : (
            <>
              <Upload /> Publish song
            </>
          )}
        </button>
      </form>
    </section>
  )
}

/* ---------- Create an album ---------- */

function AlbumPanel({ tracks }) {
  const toast = useToast()
  const navigate = useNavigate()
  const { refresh } = useLibrary()
  const [title, setTitle] = useState('')
  const [selected, setSelected] = useState([])
  const [cover, setCover] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const coverUrl = useObjectUrl(cover)

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const allSelected = tracks.length > 0 && selected.length === tracks.length

  // Live preview of how the album artwork will look
  const preview = {
    id: 'preview',
    title: title.trim() || 'New album',
    coverUrl,
    tracks: selected.map((id) => tracks.find((t) => t.id === id)).filter(Boolean),
  }

  const pickCover = (f) => {
    if (!f) return
    if (!f.type.startsWith('image/')) return setError('The album picture must be an image (JPG, PNG or WebP).')
    if (f.size > MAX_IMAGE_BYTES) return setError('That picture is over 8 MB. Please choose a smaller one.')
    setError('')
    setCover(f)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return setError('Give your album a title.')
    if (!selected.length) return setError('Pick at least one song.')

    setError('')
    setSaving(true)
    try {
      const album = await musicApi.createAlbum({ title: title.trim(), musics: selected, cover })
      toast.success(`Album “${album.title}” released`)
      await refresh()
      navigate(`/album/${album.id}`)
    } catch (err) {
      setError(getErrorMessage(err, 'Couldn’t create the album. Please try again.'))
      setSaving(false)
    }
  }

  return (
    <section className="panel" aria-labelledby="album-heading">
      <div className="panel-head">
        <span className="panel-icon">
          <Disc3 />
        </span>
        <div>
          <h2 id="album-heading">Create an album</h2>
          <p>Songs play in the order you pick them</p>
        </div>
      </div>

      {tracks.length === 0 ? (
        <div className="panel-empty">
          <ListMusic />
          <p>Upload at least one song and it’ll show up here, ready to add to an album.</p>
        </div>
      ) : (
        <form className="stack" onSubmit={submit}>
          <div className="album-builder">
            <div className="upload-cover">
              <AlbumArt album={preview} label={false} />
              {!saving && (
                <label className="upload-cover-change" title="Choose an album picture">
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      pickCover(e.target.files?.[0])
                      e.target.value = ''
                    }}
                  />
                  <Camera /> {cover ? 'Change' : 'Picture'}
                </label>
              )}
            </div>
            <div className="field album-builder-title">
              <label htmlFor="album-title">Album title</label>
              <input
                id="album-title"
                className="input input-plain"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Neon Nights"
                maxLength={120}
                disabled={saving}
              />
              <p className="upload-found">
                {cover ? (
                  <>
                    Using your picture
                    <button type="button" className="link-btn" onClick={() => setCover(null)}>
                      <RotateCcw size={13} /> Use song covers
                    </button>
                  </>
                ) : (
                  'No picture? We’ll use the covers of the songs you pick.'
                )}
              </p>
            </div>
          </div>

          <div className="field">
            <div className="field-row">
              <span className="field-label">
                Songs <span className="muted">· {selected.length} selected</span>
              </span>
              <button
                type="button"
                className="link-btn"
                onClick={() => setSelected(allSelected ? [] : tracks.map((t) => t.id))}
              >
                {allSelected ? 'Clear' : 'Select all'}
              </button>
            </div>
            <ul className="pick-list">
              {tracks.map((t) => {
                const order = selected.indexOf(t.id)
                const on = order !== -1
                return (
                  <li key={t.id}>
                    <label className={`pick-row${on ? ' is-on' : ''}`}>
                      <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(t.id)} />
                      <span className="pick-check">{on ? order + 1 : ''}</span>
                      <Cover src={t.coverUrl} seed={t.id} size={40} />
                      <span className="pick-text">
                        <strong>{t.title}</strong>
                        <small>
                          {t.byline} · {timeAgo(dateFromId(t.id))}
                        </small>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>

          {error && (
            <div className="form-error" role="alert">
              <CircleAlert />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? (
              <>
                <LoaderCircle className="spin" /> Releasing…
              </>
            ) : (
              <>
                <Plus /> Release album
              </>
            )}
          </button>
        </form>
      )}
    </section>
  )
}

/* ---------- Manage your songs & albums ---------- */

function GenreOptions() {
  const { genres } = useLibrary()
  const names = [...new Set([...genres.map((g) => g.name), ...GENRES])]
  return (
    <datalist id="genre-options">
      {names.map((g) => (
        <option key={g} value={g} />
      ))}
    </datalist>
  )
}

function ManageSongs({ tracks }) {
  const toast = useToast()
  const { refresh } = useLibrary()
  const { refresh: refreshCollection } = useCollection()
  const { currentId, isPlaying, playTracks, togglePlay } = usePlayer()
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)

  const remove = async () => {
    setBusy(true)
    try {
      await musicApi.deleteTrack(deleting.id)
      toast.success(`Deleted “${deleting.title}”`)
      await Promise.all([refresh(), refreshCollection()]) // it's also gone from likes & playlists
      setDeleting(null)
    } catch (e) {
      toast.error(getErrorMessage(e, 'Couldn’t delete the song.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Section title="Your songs" subtitle={`${plural(tracks.length, 'song')} · edit a title, genre or picture, or remove a song`}>
      {tracks.length ? (
        <ul className="manage-list">
          {tracks.map((t, i) => {
            const isCurrent = currentId === t.id
            return (
              <li key={t.id} className={`manage-row${isCurrent ? ' is-current' : ''}`}>
                <button
                  type="button"
                  className="manage-play"
                  onClick={() => (isCurrent ? togglePlay() : playTracks(tracks, i, MY_UPLOADS))}
                  aria-label={`${isCurrent && isPlaying ? 'Pause' : 'Play'} ${t.title}`}
                >
                  <Cover src={t.coverUrl} seed={t.id} size={44} />
                </button>
                <div className="manage-text">
                  <strong>{t.title}</strong>
                  <span>
                    {t.byline}
                    {t.genre && ` · ${t.genre}`}
                  </span>
                </div>
                <span className="manage-stat">{plural(t.plays, 'play')}</span>
                <span className="manage-stat">{t.duration ? formatTime(t.duration) : '—'}</span>
                <div className="manage-actions">
                  <button type="button" className="icon-btn" onClick={() => setEditing(t)} title="Edit" aria-label={`Edit ${t.title}`}>
                    <Pencil />
                  </button>
                  <button type="button" className="icon-btn icon-danger" onClick={() => setDeleting(t)} title="Delete" aria-label={`Delete ${t.title}`}>
                    <Trash2 />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="muted">Nothing uploaded yet — your first song will appear here.</p>
      )}

      {editing && <EditSongModal track={editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmModal title="Delete this song?" busy={busy} onConfirm={remove} onClose={() => setDeleting(null)}>
          <strong>{deleting.title}</strong> will be removed from Beat Flow, including every album, playlist and Liked Songs list it’s in.
        </ConfirmModal>
      )}
    </Section>
  )
}

function EditSongModal({ track, onClose }) {
  const toast = useToast()
  const { refresh } = useLibrary()
  const { refresh: refreshCollection } = useCollection()
  const [genre, setGenre] = useState(track.genre)

  const save = async ({ name, cover }) => {
    await musicApi.updateTrack(track.id, { title: name, genre: genre.trim(), cover })
    await Promise.all([refresh(), refreshCollection()])
    toast.success('Song updated')
  }

  return (
    <EditDetailsModal
      title="Edit song"
      nameLabel="Title"
      withDescription={false}
      item={{ id: track.id, name: track.title, coverUrl: track.coverUrl, tracks: [] }}
      onSave={save}
      onClose={onClose}
      extra={
        <div className="field">
          <label htmlFor="edit-genre">Genre</label>
          <input id="edit-genre" className="input input-plain" value={genre} onChange={(e) => setGenre(e.target.value)} list="genre-options" maxLength={40} />
          <GenreOptions />
        </div>
      }
    />
  )
}

function ManageAlbums({ albums }) {
  const toast = useToast()
  const { refresh } = useLibrary()
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)

  if (!albums.length) return null

  const save = async ({ name, cover }) => {
    await musicApi.updateAlbum(editing.id, { title: name, cover })
    await refresh()
    toast.success('Album updated')
  }

  const remove = async () => {
    setBusy(true)
    try {
      await musicApi.deleteAlbum(deleting.id)
      toast.success(`Deleted “${deleting.title}”`)
      await refresh()
      setDeleting(null)
    } catch (e) {
      toast.error(getErrorMessage(e, 'Couldn’t delete the album.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Section title="Your albums" subtitle="Rename, change the picture, or remove an album (its songs stay)">
      <div className="card-grid">
        {albums.map((a) => (
          <div key={a.id} className="card manage-card">
            <Link to={`/album/${a.id}`} className="card-art">
              <AlbumArt album={a} />
            </Link>
            <h3 className="card-title">{a.title}</h3>
            <p className="card-sub">{plural(a.tracks.length, 'song')}</p>
            <div className="manage-card-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(a)}>
                <Pencil /> Edit
              </button>
              <button type="button" className="icon-btn icon-danger" onClick={() => setDeleting(a)} title="Delete album" aria-label={`Delete ${a.title}`}>
                <Trash2 />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <EditDetailsModal
          title="Edit album"
          nameLabel="Album title"
          withDescription={false}
          item={{ ...editing, name: editing.title }}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <ConfirmModal title="Delete this album?" busy={busy} onConfirm={remove} onClose={() => setDeleting(null)}>
          <strong>{deleting.title}</strong> will be removed. Its songs stay on Beat Flow.
        </ConfirmModal>
      )}
    </Section>
  )
}
