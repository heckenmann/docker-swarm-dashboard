import React from 'react'
import { Card } from 'react-bootstrap'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, errorMessage: error.toString() }
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.log(error, errorInfo)
  }

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
