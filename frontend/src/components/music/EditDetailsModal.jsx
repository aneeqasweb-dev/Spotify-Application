import { useState } from 'react'
import { Camera, CircleAlert } from 'lucide-react'
import { getErrorMessage } from '../../api/client'
import { useObjectUrl } from '../../hooks/useObjectUrl'
import Modal from '../ui/Modal'
import AlbumArt from './AlbumArt'

const MAX_IMAGE_BYTES = 8 * 1024 * 1024

/**
 * "Edit details" window for playlists, albums and songs: name, optional description, picture.
 * onSave({ name, description, cover }) should return a promise.
 */
export default function EditDetailsModal({ title = 'Edit details', item, nameLabel = 'Name', withDescription = true, extra, onSave, onClose }) {
  const [name, setName] = useState(item.name ?? item.title ?? '')
  const [description, setDescription] = useState(item.description ?? '')
  const [cover, setCover] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const coverUrl = useObjectUrl(cover)

  const pick = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('Please choose an image (JPG, PNG or WebP).')
    if (file.size > MAX_IMAGE_BYTES) return setError('That picture is over 8 MB. Please choose a smaller one.')
    setError('')
    setCover(file)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return setError(`${nameLabel} can’t be empty.`)
    setSaving(true)
    setError('')
    try {
      await onSave({ name: name.trim(), description: description.trim(), cover })
      onClose()
    } catch (err) {
      setError(getErrorMessage(err, 'Couldn’t save your changes.'))
      setSaving(false)
    }
  }

  const preview = { ...item, coverUrl: coverUrl || item.coverUrl, tracks: item.tracks ?? [] }

  return (
    <Modal title={title} onClose={onClose}>
      <form className="edit-details" onSubmit={submit} id="edit-details-form">
        <label className="edit-cover" title="Choose a picture">
          <AlbumArt album={preview} placeholder label={false} />
          <span className="edit-cover-hover">
            <Camera />
            Choose photo
          </span>
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
        </label>
        <div className="edit-fields">
          <div className="field">
            <label htmlFor="edit-name">{nameLabel}</label>
            <input id="edit-name" className="input input-plain" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
          </div>
          {withDescription && (
            <div className="field">
              <label htmlFor="edit-description">Description</label>
              <textarea
                id="edit-description"
                className="input input-plain textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={300}
                placeholder="Add an optional description"
              />
            </div>
          )}
          {extra}
        </div>
      </form>
      {error && (
        <div className="form-error" role="alert">
          <CircleAlert />
          <span>{error}</span>
        </div>
      )}
      <div className="modal-actions">
        <button type="submit" form="edit-details-form" className="btn btn-light" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Modal>
  )
}
