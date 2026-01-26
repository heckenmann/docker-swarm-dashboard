import React from 'react'
import { Card, Button } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

/**
 * ErrorBoundary is a React component that catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
    this.retry = this.retry.bind(this)
  }

  /**
   * This lifecycle method is invoked after an error has been thrown by a descendant component.
   * It updates the state to indicate that an error has occurred.
   *
   * @param {Error} error - The error that was thrown.
   * @returns {Object} An object to update the state with the error information.
   */
  static getDerivedStateFromError(error) {
    // Prefer stack when available so we show useful details; fall back to message/string
    const msg =
      error && error.stack
        ? error.stack
        : error && error.message
          ? error.message
          : String(error)
    return { hasError: true, errorMessage: msg }
  }

  /**
   * This lifecycle method is invoked after an error has been thrown by a descendant component.
   * It is used to log error information.
   *
   * @param {Error} error - The error that was thrown.
   * @param {Object} errorInfo - An object with information about the component stack.
   */
  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.log(error, errorInfo)
  }

  /**
   * Retries the failed action, if possible. It attempts to reload the current page with a cache-busting
   * timestamp parameter. If that fails, it falls back to a normal page reload.
   */
  retry() {
    try {
      const url = new URL(window.location.href)
      if (url.searchParams.has('_retry')) {
        // remove all existing _retry params and navigate to clean URL
        url.searchParams.delete('_retry')
        window.location.replace(url.toString())
      } else {
        // no _retry params present — simply reload the page in place
        window.location.reload()
      }
    } catch {
      try {
        window.location.reload()
      } catch {}
    }
  }

  /**
   * Renders the component. If an error has occurred, it displays a fallback UI.
   * Otherwise, it renders the child components.
   *
   * @returns {React.ReactNode} The rendered component.
   */
  render() {
    if (this.state.hasError) {
      return (
        <div className="loading-overlay" role="alert" aria-live="polite">
          <Card
            bg="danger"
            text="light"
            className="card-elevated p-4 loading-card"
          >
            <Card.Body className="text-center">
              <div className="d-flex flex-column align-items-center">
                <FontAwesomeIcon
                  icon="exclamation-triangle"
                  className="mb-3"
                  style={{ fontSize: '2.25rem' }}
                  aria-hidden="true"
                />
                <h4 className="mb-0 loading-title">Error</h4>
                <div className="loading-subtitle">
                  An unexpected error occurred — you can retry loading the page.
                </div>
                <pre
                  className="mt-2 small text-muted text-start"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '40vh',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    background: 'rgba(0,0,0,0.06)',
                    padding: '0.75rem',
                    borderRadius: '0.25rem',
                    fontFamily: 'monospace',
                  }}
                >
                  <code style={{ whiteSpace: 'pre-wrap' }}>
                    {String(this.state.errorMessage)}
                  </code>
                </pre>
                <div className="w-100 mt-3 d-flex justify-content-center">
                  <Button variant="warning" onClick={this.retry}>
                    <FontAwesomeIcon icon="sync" /> Retry
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
