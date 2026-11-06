import { CircleAlert, Music2, RefreshCw } from 'lucide-react'

export default function EmptyState({ icon: Icon = Music2, title, children, action }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon />
      </div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <EmptyState
      icon={CircleAlert}
      title="The music stopped"
      action={
        onRetry && (
          <button type="button" className="btn btn-ghost" onClick={onRetry}>
            <RefreshCw /> Try again
          </button>
        )
      }
    >
      {message}
    </EmptyState>
  )
}
