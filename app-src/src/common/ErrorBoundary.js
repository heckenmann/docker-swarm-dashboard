import React from 'react'
import { Card } from 'react-bootstrap'

/**
 * ErrorBoundary is a React component that catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  /**
   * This lifecycle method is invoked after an error has been thrown by a descendant component.
   * It updates the state to indicate that an error has occurred.
   *
   * @param {Error} error - The error that was thrown.
   * @returns {Object} An object to update the state with the error information.
   */
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, errorMessage: error.toString() }
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
   * Renders the component. If an error has occurred, it displays a fallback UI.
   * Otherwise, it renders the child components.
   *
   * @returns {React.ReactNode} The rendered component.
   */
  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <Card bg="danger" text="light">
          <Card.Header>
            <h1>Error</h1>
          </Card.Header>
          <Card.Body>{this.state.errorMessage}</Card.Body>
        </Card>
      )
    }

    return this.props.children
  }
}
