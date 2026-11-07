// Remembers which albums / playlists / mixes you played, for "Recently Played" on Home.
// Stored per account in this browser.

const key = (userId) => `beatflow:recent-contexts:${userId}`
const MAX = 12

export function readRecentContexts(userId) {
  if (!userId) return []
  try {
    const list = JSON.parse(localStorage.getItem(key(userId)))
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function rememberContext(userId, context) {
  if (!userId || !context?.id) return
  // Search results and one-off lists aren't worth remembering
  if (/^(search:|fresh|recent|trending|queue|resume|studio)/.test(context.id)) return
  const list = [context.id, ...readRecentContexts(userId).filter((id) => id !== context.id)].slice(0, MAX)
  try {
    localStorage.setItem(key(userId), JSON.stringify(list))
    window.dispatchEvent(new Event('beatflow:recent-contexts'))
  } catch {
    /* storage unavailable */
  }
}
