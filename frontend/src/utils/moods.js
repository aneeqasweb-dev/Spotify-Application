// "Browse by Mood": each mood picks matching songs by genre, title words and editorial playlists

export const MOODS = [
  {
    slug: 'happy',
    name: 'Happy',
    icon: 'Sun',
    tagline: 'Bright, bouncy songs to lift your day.',
    genres: ['Pop', 'Latin', 'Funk & Blues', 'K-Pop'],
    playlists: ['Feel Good'],
    colors: ['#fbbf24', '#f472b6'],
  },
  {
    slug: 'relax',
    name: 'Relax',
    icon: 'Flower2',
    tagline: 'Mellow grooves to slow everything down.',
    genres: ['Lounge', 'Jazz', 'Indie', 'Alternative'],
    playlists: ['Chill Vibes'],
    colors: ['#34d399', '#60a5fa'],
  },
  {
    slug: 'workout',
    name: 'Workout',
    icon: 'Zap',
    tagline: 'High-energy tracks to keep you moving.',
    genres: ['Cinematic', 'Electronic', 'Hip-Hop', 'Afrobeats', 'Dance'],
    playlists: [],
    colors: ['#f97316', '#ef4444'],
  },
  {
    slug: 'sleep',
    name: 'Sleep',
    icon: 'Moon',
    tagline: 'Gentle, slow sounds for winding down.',
    genres: ['Jazz'],
    keywords: /chill|night|dream|lobby|smooth|feather|love yourself|dracula/i,
    playlists: [],
    colors: ['#6366f1', '#1e1b4b'],
  },
  {
    slug: 'love',
    name: 'Love',
    icon: 'Heart',
    tagline: 'Songs about love, crushes and heartbreak.',
    genres: ['R&B'],
    keywords: /love|heart|kiss|smile|baby|peaches|stay|essence|nwantiti|lovin|sorry|flowers|feather/i,
    playlists: [],
    colors: ['#ec4899', '#8b5cf6'],
  },
]

export function findMood(slug) {
  return MOODS.find((m) => m.slug === slug) || null
}

// Songs for a mood: songs from its playlists first, then genre / title matches, most played first
export function moodTracks(mood, tracks, playlists) {
  const picked = new Map()
  for (const p of playlists) {
    if (mood.playlists.includes(p.name)) for (const t of p.tracks) picked.set(t.id, t)
  }
  const matches = tracks
    .filter((t) => mood.genres.includes(t.genre) || (mood.keywords && mood.keywords.test(t.title)))
    .sort((a, b) => b.plays - a.plays)
  for (const t of matches) if (!picked.has(t.id)) picked.set(t.id, t)
  return [...picked.values()]
}
