import { Link } from 'react-router-dom'
import { Flower2, Heart, Moon, Sun, Zap } from 'lucide-react'

const ICONS = { Sun, Flower2, Zap, Moon, Heart }

// A "Browse by Mood" tile
export default function MoodTile({ mood }) {
  const Icon = ICONS[mood.icon] || Sun
  return (
    <Link to={`/mood/${mood.slug}`} className="mood-tile" style={{ '--m1': mood.colors[0], '--m2': mood.colors[1] }}>
      <Icon className="mood-icon" fill={mood.icon === 'Sun' || mood.icon === 'Flower2' || mood.icon === 'Zap' ? 'none' : 'currentColor'} />
      <span className="mood-name">{mood.name}</span>
    </Link>
  )
}

export { ICONS as MOOD_ICONS }
