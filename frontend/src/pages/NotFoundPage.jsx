import { Link } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import EmptyState from '../components/ui/EmptyState'

export default function NotFoundPage() {
  return (
    <EmptyState
      icon={SearchX}
      title="This page skipped a beat"
      action={
        <Link to="/" className="btn btn-primary">
          Back to Home
        </Link>
      }
    >
      We couldn’t find what you were looking for.
    </EmptyState>
  )
}
