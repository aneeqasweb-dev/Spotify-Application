// Marks songs that are official 30-second previews (the full song is on Apple Music)
export default function PreviewBadge({ className = '' }) {
  return (
    <span className={`preview-badge ${className}`} title="30-second preview — the full song is on Apple Music">
      Preview
    </span>
  )
}
