import { render, screen } from '@testing-library/react'
import React from 'react'
import DSDCard from '../../../src/components/common/DSDCard'

// Mock FontAwesomeIcon
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="fa-icon" />,
}))

describe('DSDCard', () => {
  test('renders with icon and title', () => {
    render(<DSDCard icon="server" title="My Card" body="Content" />)
    expect(screen.getByText('My Card')).toBeInTheDocument()
    expect(screen.getByTestId('fa-icon')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  test('renders header actions', () => {
    render(
      <DSDCard
        title="Actions Card"
        headerActions={<button>Action</button>}
        body="Content"
      />,
    )
    expect(screen.getByText('Action')).toBeInTheDocument()
  })

  test('renders children when body is not provided', () => {
    render(
      <DSDCard>
        <div>Child Content</div>
      </DSDCard>,
    )
    expect(screen.getByText('Child Content')).toBeInTheDocument()
  })

  test('supports legacy header prop', () => {
    render(<DSDCard header={<h5>Legacy Header</h5>} body="Content" />)
    expect(screen.getByText('Legacy Header')).toBeInTheDocument()
  })
})

test('renders table children directly without a card body or padding wrapper', () => {
  const { container } = render(
    <DSDCard title="Inventory">
      <table>
        <tbody>
          <tr>
            <td>Value</td>
          </tr>
        </tbody>
      </table>
    </DSDCard>,
  )
  const card = container.querySelector('.card')
  expect(card.querySelector('.card-body')).toBeNull()
  expect(card.querySelector('table').parentElement).toBe(card)
})
