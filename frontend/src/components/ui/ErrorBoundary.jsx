import { Component } from 'react'
import { LogoMark } from './Logo'

// If any screen crashes, show a friendly message with a Reload button
// instead of a blank page.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Beat Flow crashed:', error, info?.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="crash">
        <LogoMark size={56} />
        <h1>Something went wrong</h1>
        <p>Beat Flow hit an unexpected problem. Reloading usually fixes it.</p>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          Reload Beat Flow
        </button>
      </div>
    )
  }
}
