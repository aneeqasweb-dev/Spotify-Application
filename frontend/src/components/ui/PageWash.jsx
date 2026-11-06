// The colour glow at the top of each page (Spotify-style). `strong` = album pages.
export default function PageWash({ color = '#2a5bd7', strong = false }) {
  return <div className={`page-wash${strong ? ' is-strong' : ''}`} style={{ '--wash': color }} aria-hidden="true" />
}
