import Modal from '../ui/Modal'
import Cover from '../music/Cover'

// "Song credits": who made it and under which licence it's shared
export default function CreditsModal({ track, onClose }) {
  const licenceUrl = track.credits.includes('CC BY 4.0') ? 'https://creativecommons.org/licenses/by/4.0/' : null
  const fullSong = track.isPreview ? track.externalUrl : null

  return (
    <Modal title="Credits" onClose={onClose} size="sm">
      <div className="credits-head">
        <Cover src={track.coverUrl} seed={track.id} size={56} />
        <div>
          <strong>{track.title}</strong>
          <span>{track.byline}</span>
        </div>
      </div>
      <dl className="credits-list">
        <div>
          <dt>Performed by</dt>
          <dd>{track.byline}</dd>
        </div>
        {track.genre && (
          <div>
            <dt>Genre</dt>
            <dd>{track.genre}</dd>
          </div>
        )}
        {(track.albumName || track.releaseYear) && (
          <div>
            <dt>Released</dt>
            <dd>{[track.albumName, track.releaseYear].filter(Boolean).join(' · ')}</dd>
          </div>
        )}
        <div>
          <dt>Source &amp; licence</dt>
          <dd>
            {track.credits || 'Uploaded to Beat Flow by the artist.'}
            {licenceUrl && (
              <>
                {' '}
                <a href={licenceUrl} target="_blank" rel="noreferrer">
                  Read the licence
                </a>
              </>
            )}
            {fullSong && (
              <>
                {' '}
                <a href={fullSong} target="_blank" rel="noreferrer">
                  Open in Apple Music
                </a>
              </>
            )}
          </dd>
        </div>
      </dl>
    </Modal>
  )
}
