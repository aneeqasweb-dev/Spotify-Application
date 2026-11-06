export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = String(total % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}

// MongoDB ObjectIds start with the creation time (seconds since 1970, in hex)
export function dateFromId(id) {
  const seconds = parseInt(String(id).slice(0, 8), 16)
  return Number.isFinite(seconds) ? new Date(seconds * 1000) : null
}

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

export function timeAgo(date) {
  if (!date) return ''
  const diff = (date.getTime() - Date.now()) / 1000
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [unit, size] of units) {
    if (Math.abs(diff) >= size) return rtf.format(Math.round(diff / size), unit)
  }
  return 'just now'
}

export function greeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 5) return 'Late night vibes'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function longDate(date = new Date()) {
  return date.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })
}

export function plural(count, word, pluralWord = `${word}s`) {
  return `${count} ${count === 1 ? word : pluralWord}`
}

export function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function titleFromFileName(name) {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Total length of a list of songs, e.g. "11 min 40 sec" or "1 hr 5 min"
export function totalLength(tracks) {
  const seconds = tracks.reduce((sum, t) => sum + (t.duration || 0), 0)
  if (!seconds) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.round(seconds % 60)
  return h ? `${h} hr ${m} min` : `${m} min ${s} sec`
}
