import { MOOD_ICONS } from './MoodTile'

// Square artwork for a mood: its colours + its icon
export default function MoodArt({ mood, className = '' }) {
  const Icon = MOOD_ICONS[mood.icon]
  return (
    <div className={`cover mood-art ${className}`} style={{ '--m1': mood.colors[0], '--m2': mood.colors[1] }} aria-hidden="true">
      <Icon />
      <span>{mood.name}</span>
    </div>
  )
}
