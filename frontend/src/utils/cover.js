// Real pictures come from ImageKit. Songs without a picture get generated artwork
// instead (the same id always produces the same cover).

// Ask ImageKit for a resized copy (much smaller download than the original)
export function imageUrl(src, size) {
  if (!src || !size) return src || ''
  if (src.includes('ik.imagekit.io')) return `${src}${src.includes('?') ? '&' : '?'}tr=w-${size},h-${size}`
  if (src.includes('mzstatic.com')) return src.replace(/\/\d+x\d+bb\./, `/${Math.min(size, 1200)}x${Math.min(size, 1200)}bb.`)
  return src
}

const PALETTES = [
  ['#4c9dff', '#7b5cff', '#0b1030'],
  ['#36d1dc', '#5b86e5', '#071a2c'],
  ['#a66cff', '#ff5fa2', '#160a2a'],
  ['#00c9a7', '#3a7bd5', '#04201f'],
  ['#5f72ff', '#9921e8', '#0d0726'],
  ['#2ec5ff', '#3f5efb', '#0a1230'],
  ['#ff5fa2', '#7a2cff', '#12052a'],
  ['#3ddc97', '#1fa2ff', '#071f24'],
  ['#c471f5', '#4c9dff', '#120a2e'],
  ['#43e97b', '#38f9d7', '#03201a'],
  ['#6a85ff', '#00d4ff', '#06142b'],
  ['#f093fb', '#5b6cff', '#1a0b2a'],
]

export function hashString(input) {
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function wavePath(hash) {
  const lines = []
  for (let line = 0; line < 3; line++) {
    const baseY = 52 + line * 9 + (hash % 7)
    const amp = 5 + ((hash >>> (line + 4)) % 9)
    const freq = 1 + ((hash >>> (line + 9)) % 3) * 0.5
    const phase = ((hash >>> (line + 13)) % 628) / 100
    let d = ''
    for (let x = 0; x <= 100; x += 4) {
      const y = baseY + amp * Math.sin((x / 100) * Math.PI * 2 * freq + phase)
      d += `${x === 0 ? 'M' : 'L'}${x} ${y.toFixed(2)} `
    }
    lines.push(d.trim())
  }
  return lines.join(' ')
}

const cache = new Map()

export function coverArt(seed = 'beatflow') {
  const key = String(seed)
  if (cache.has(key)) return cache.get(key)

  const h = hashString(key)
  const [a, b, c] = PALETTES[h % PALETTES.length]
  const pick = (shift, min, range) => min + ((h >>> shift) % range)

  const background = [
    `radial-gradient(circle at ${pick(3, 5, 40)}% ${pick(7, 5, 40)}%, ${a} 0%, transparent 58%)`,
    `radial-gradient(circle at ${pick(11, 55, 40)}% ${pick(15, 15, 45)}%, ${b} 0%, transparent 52%)`,
    `radial-gradient(circle at ${pick(19, 15, 70)}% ${pick(23, 65, 30)}%, ${a}b3 0%, transparent 50%)`,
    `linear-gradient(${pick(5, 0, 360)}deg, ${c} 0%, ${b}66 100%)`,
  ].join(', ')

  const patterns = ['rings', 'wave', 'plain', 'wave', 'rings', 'grid']
  const art = {
    background,
    pattern: patterns[(h >>> 9) % patterns.length],
    wave: wavePath(h),
    colors: [a, b, c],
  }
  cache.set(key, art)
  return art
}
