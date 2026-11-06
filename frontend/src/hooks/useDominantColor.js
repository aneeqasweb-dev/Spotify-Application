import { useEffect, useState } from 'react'
import { imageUrl } from '../utils/cover'

// Reads the main colour of a cover picture (like Spotify's coloured page headers).
// It loads a tiny 48px copy, so it's fast. Results are cached per picture.

const cache = new Map() // src -> Promise<string | null>

function toHex(r, g, b) {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`
}

// Keep colours rich but dark enough for white text on top
function tune(r, g, b) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  let l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h /= 6
  }
  s = Math.min(s * 1.15, 0.78)
  l = Math.min(Math.max(l, 0.3), 0.46)

  const hue = (p, q, t) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return toHex(hue(p, q, h + 1 / 3) * 255, hue(p, q, h) * 255, hue(p, q, h - 1 / 3) * 255)
}

export function extractColor(src) {
  if (!src) return Promise.resolve(null)
  if (cache.has(src)) return cache.get(src)

  const promise = new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous' // ImageKit allows this, so the canvas can read pixels
    img.decoding = 'async'
    img.onload = () => {
      try {
        const size = 24
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(img, 0, 0, size, size)
        const data = ctx.getImageData(0, 0, size, size).data

        // Average the pixels, giving colourful ones more weight than grey/black/white
        let r = 0
        let g = 0
        let b = 0
        let total = 0
        for (let i = 0; i < data.length; i += 4) {
          const R = data[i]
          const G = data[i + 1]
          const B = data[i + 2]
          const max = Math.max(R, G, B)
          const min = Math.min(R, G, B)
          const light = (max + min) / 510
          const sat = max ? (max - min) / max : 0
          const weight = light < 0.08 || light > 0.94 ? 0.05 : 0.25 + sat * 2
          r += R * weight
          g += G * weight
          b += B * weight
          total += weight
        }
        resolve(total ? tune(r / total, g / total, b / total) : null)
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = imageUrl(src, 48)
  })

  cache.set(src, promise)
  return promise
}

export function useDominantColor(src, fallback) {
  const [color, setColor] = useState(null)

  useEffect(() => {
    if (!src) return undefined
    let alive = true
    // Keep showing the previous colour until the new one is ready (smooth fade, no flash)
    extractColor(src).then((c) => alive && setColor(c))
    return () => {
      alive = false
    }
  }, [src])

  if (!src) return fallback
  return color || fallback
}
