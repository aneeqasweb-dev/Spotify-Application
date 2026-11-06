import { Fragment, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Disc3 } from 'lucide-react'
import { getErrorMessage, musicApi } from '../api/client'
import AlbumArt, { albumCoverSrc } from '../components/music/AlbumArt'
import { AlbumCard } from '../components/music/Cards'
import CollectionHeader, { ActionBar } from '../components/music/CollectionHeader'
import TrackList from '../components/music/TrackList'
import EmptyState, { ErrorState } from '../components/ui/EmptyState'
import PageWash from '../components/ui/PageWash'
import Section from '../components/ui/Section'
import { RowSkeletons } from '../components/ui/Skeletons'
import { useLibrary } from '../context/LibraryContext'
import { usePlayer } from '../context/PlayerContext'
import { useDominantColor } from '../hooks/useDominantColor'
import { creditSummary, splitArtists } from '../utils/artists'
import { coverArt } from '../utils/cover'
import { dateFromId, plural, totalLength } from '../utils/format'

export default function AlbumPage() {
  const { albumId } = useParams()
  const { albums } = useLibrary()
  const cached = albums.find((a) => a.id === albumId)
  const [state, setState] = useState({ albumId, status: 'loading', album: null, error: null })

  // Show the copy we already have instantly, then refresh it from the API
  useEffect(() => {
    let alive = true
    musicApi
      .album(albumId)
      .then((album) => alive && setState({ albumId, status: 'ready', album, error: null }))
      .catch((err) => {
        if (!alive) return
        const notFound = err.response?.status === 404
        setState({ albumId, status: notFound ? 'notfound' : 'error', album: null, error: getErrorMessage(err) })
      })
    return () => {
      alive = false
    }
  }, [albumId])

  const fresh = state.albumId === albumId ? state : { status: 'loading' }
  const album = cached ?? fresh.album

  if (!album && fresh.status === 'notfound') {
    return (
      <EmptyState icon={Disc3} title="Album not found" action={<Link to="/library?view=albums" className="btn btn-ghost">Browse albums</Link>}>
        This album may have been removed, or the link is incorrect.
      </EmptyState>
    )
  }
  if (!album && fresh.status === 'error') return <ErrorState message={fresh.error} />
  if (!album) return <RowSkeletons count={6} />

  return <AlbumView album={album} />
}

function AlbumView({ album }) {
  const { albums } = useLibrary()
  const { context, isPlaying, playTracks, togglePlay, shufflePlay } = usePlayer()
  const ctx = { id: album.id, label: album.title }
  const isThis = context?.id === album.id
  const wash = useDominantColor(albumCoverSrc(album), coverArt(album.id).colors[0])
  const year = Math.max(0, ...album.tracks.map((t) => t.releaseYear || 0)) || dateFromId(album.id)?.getFullYear()
  const length = totalLength(album.tracks)
  const artists = album.byline === 'Various Artists' ? [] : splitArtists(album.byline)
  const moreByArtist = albums.filter((a) => a.byline === album.byline && a.id !== album.id)
  const credits = creditSummary(album.tracks)

  return (
    <>
      <PageWash color={wash} strong />
      <CollectionHeader
        art={<AlbumArt album={album} res={560} eager />}
        eyebrow="Album"
        title={album.title}
        meta={
          <span>
            {artists.length
              ? artists.map((a, i) => (
                  <Fragment key={a.slug}>
                    {i > 0 && ', '}
                    <Link to={`/artist/${a.slug}`} className="meta-link">
                      {a.name}
                    </Link>
                  </Fragment>
                ))
              : <strong>{album.byline}</strong>}
            {year && ` · ${year}`} · {plural(album.tracks.length, 'song')}
            {length && <span className="muted">, {length}</span>}
          </span>
        }
      />

      {album.tracks.length > 0 ? (
        <>
          <ActionBar
            label={album.title}
            playing={isThis && isPlaying}
            onPlay={() => (isThis ? togglePlay() : playTracks(album.tracks, 0, ctx))}
            onShuffle={() => shufflePlay(album.tracks, ctx)}
          />
          <TrackList tracks={album.tracks} context={ctx} showAlbum={false} />
          <footer className="release-notes">
            {year && <p>{year}</p>}
            {credits.map((c) => (
              <p key={c}>{c}</p>
            ))}
          </footer>
        </>
      ) : (
        <EmptyState icon={Disc3} title="This album is empty">
          The songs on this album are no longer available.
        </EmptyState>
      )}

      {moreByArtist.length > 0 && (
        <Section title={`More by ${album.byline}`}>
          <div className="shelf">
            {moreByArtist.map((a) => (
              <AlbumCard key={a.id} album={a} />
            ))}
          </div>
        </Section>
      )}
    </>
  )
}
