// Artists in Beat Flow come from the artist name stored with each song
// ("G-Eazy, Halsey" → two artists). Every artist gets a URL-friendly slug.

export function slugify(text) {
  return (
    String(text)
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'artist'
  )
}

export function splitArtists(byline) {
  return String(byline || '')
    .split(/\s*,\s*|\s+&\s+|\s+(?:feat\.?|ft\.?|featuring)\s+/i)
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ name, slug: slugify(name) }))
}

// One shared name for a group of songs (albums / playlists): the artist if they all match
export function sharedByline(tracks, fallback = '') {
  const names = [...new Set(tracks.map((t) => t.byline).filter(Boolean))]
  if (names.length === 1) return names[0]
  if (names.length > 1) return 'Various Artists'
  return fallback
}

// Build the artist list from all songs, most played first
export function buildArtists(tracks) {
  const map = new Map()
  for (const track of tracks) {
    for (const { name, slug } of track.artists) {
      const entry = map.get(slug) ?? { slug, name, tracks: [], plays: 0, coverUrl: '', famous: false }
      entry.tracks.push(track)
      entry.plays += track.plays
      if (track.isPreview) entry.famous = true
      map.set(slug, entry)
    }
  }
  // Artist photo: a cover from a song that's theirs alone (a duet cover may show someone else)
  for (const entry of map.values()) {
    const solo = entry.tracks.find((t) => t.coverUrl && t.artists.length === 1)
    const first = entry.tracks.find((t) => t.coverUrl && t.artists[0]?.slug === entry.slug)
    entry.coverUrl = (solo || first || entry.tracks.find((t) => t.coverUrl))?.coverUrl || ''
  }
  return [...map.values()].sort(
    (a, b) => b.plays - a.plays || b.famous - a.famous || b.tracks.length - a.tracks.length,
  )
}

// Short credit lines for a group of songs (album, artist page) instead of one line per song
export function creditSummary(tracks) {
  const lines = new Set()
  for (const t of tracks) {
    if (t.isPreview) lines.add('30-second previews courtesy of Apple Music. Listen to the full songs on Apple Music.')
    else if (t.credits.includes('CC BY 4.0')) {
      lines.add(`Music by ${t.byline} (incompetech.com) · Licensed under Creative Commons: By Attribution 4.0 (CC BY 4.0)`)
    } else if (t.credits) lines.add(t.credits)
  }
  return [...lines]
}
