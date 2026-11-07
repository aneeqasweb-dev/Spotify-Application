import { useEffect, useState } from 'react'
import { readRecentContexts } from '../utils/recentContexts'

// The ids of albums / playlists / mixes recently played by this user (newest first)
export function useRecentContexts(userId) {
  const [ids, setIds] = useState(() => readRecentContexts(userId))

  useEffect(() => {
    const update = () => setIds(readRecentContexts(userId))
    update()
    window.addEventListener('beatflow:recent-contexts', update)
    return () => window.removeEventListener('beatflow:recent-contexts', update)
  }, [userId])

  return ids
}
