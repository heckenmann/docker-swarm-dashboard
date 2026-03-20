/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { ErrorAlertOrEmpty } from '../../../../src/components/common/ErrorAlertOrEmpty'

describe('ErrorAlertOrEmpty', () => {
  it('renders error alert when error is present', () => {
    const error = new Error('Something went wrong')
    render(<ErrorAlertOrEmpty error={error} />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText(/^Error: /)).toBeInTheDocument()
  })

  it('renders children when no error', () => {
    render(
      <ErrorAlertOrEmpty error={null}>
        <span>Success content</span>
      </ErrorAlertOrEmpty>
    )
    expect(screen.getByText('Success content')).toBeInTheDocument()
  })

  it('renders empty message when error is null and no children', () => {
    render(<ErrorAlertOrEmpty error={null} />)
    expect(screen.getByText('Nothing to display')).toBeInTheDocument()
  })
})
