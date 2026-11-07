export function CardSkeletons({ count = 6 }) {
  return (
    <div className="shelf" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card card-skeleton">
          <div className="skeleton sk-art" />
          <div className="skeleton sk-line" />
          <div className="skeleton sk-line sk-short" />
        </div>
      ))}
    </div>
  )
}

export function RowSkeletons({ count = 5 }) {
  return (
    <div className="sk-rows" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="sk-row">
          <div className="skeleton sk-thumb" />
          <div className="sk-row-text">
            <div className="skeleton sk-line" />
            <div className="skeleton sk-line sk-short" />
          </div>
        </div>
      ))}
    </div>
  )
}
