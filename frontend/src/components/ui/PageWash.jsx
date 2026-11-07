// The colour glow at the top of each page (Spotify-style). `strong` = album pages.
export default function PageWash({ color = '#7c3aed', strong = false }) {
  return <div className={`page-wash${strong ? ' is-strong' : ''}`} style={{ '--wash': color }} aria-hidden="true" />
}
