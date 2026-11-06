import { useEffect, useState } from 'react'

// Durations aren't stored in the database, so we read them from each file's
// metadata (only the first few KB are downloaded), at most 3 at a time.

const durations = new Map() // uri -> seconds | null
const listeners = new Map() // uri -> Set<fn>
const waiting = []
let active = 0
const MAX_PARALLEL = 3

export function rememberDuration(uri, seconds) {
  if (!uri || !Number.isFinite(seconds)) return
  durations.set(uri, seconds)
  listeners.get(uri)?.forEach((fn) => fn(seconds))
}

function pump() {
  while (active < MAX_PARALLEL && waiting.length) {
    const uri = waiting.shift()
    if (durations.has(uri)) continue
    active++

    const audio = new Audio()
    let finished = false
    const finish = (seconds) => {
      if (finished) return
      finished = true
      clearTimeout(timer)
      active--
      durations.set(uri, Number.isFinite(seconds) ? seconds : null)
      listeners.get(uri)?.forEach((fn) => fn(durations.get(uri)))
      audio.removeAttribute('src')
      pump()
    }
    const timer = setTimeout(() => finish(null), 15000)
    audio.preload = 'metadata'
    audio.addEventListener('loadedmetadata', () => finish(audio.duration))
    audio.addEventListener('error', () => finish(null))
    audio.src = uri
  }
}

export function useTrackDuration(uri) {
  const [duration, setDuration] = useState(() => durations.get(uri) ?? null)

  useEffect(() => {
    if (!uri) return undefined
    if (durations.has(uri)) {
      setDuration(durations.get(uri))
      return undefined
    }

    const set = listeners.get(uri) ?? new Set()
    set.add(setDuration)
    listeners.set(uri, set)
    if (!waiting.includes(uri)) {
      waiting.push(uri)
      pump()
    }

    return () => {
      set.delete(setDuration)
      if (set.size === 0) {
        listeners.delete(uri)
        const i = waiting.indexOf(uri)
        if (i !== -1) waiting.splice(i, 1)
      }
    }
  }, [uri])

  return duration
}
