import { render, screen, fireEvent } from '@testing-library/react'
import { SortableHeader } from '../../../src/components/SortableHeader'

// Mock FontAwesomeIcon
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, style }) => (
    <span data-testid="icon" data-icon={icon} style={style} />
  ),
}))

describe('SortableHeader', () => {
  const mockOnSort = jest.fn()

  beforeEach(() => {
    mockOnSort.mockClear()
  })

  it('renders with unsorted state', () => {
    render(
      <table>
        <thead>
          <tr>
            <SortableHeader
              column="name"
              label="Name"
              sortBy={null}
              sortDirection="asc"
              onSort={mockOnSort}
            />
          </tr>
        </thead>
      </table>,
    )

    expect(screen.getByText('Name')).toBeInTheDocument()
    const icon = screen.getByTestId('icon')
    expect(icon).toHaveAttribute('data-icon', 'sort')
    expect(icon).toHaveStyle({ opacity: 0.3 })
  })

  it('renders with ascending sort', () => {
    render(
      <table>
        <thead>
          <tr>
            <SortableHeader
              column="name"
              label="Name"
              sortBy="name"
              sortDirection="asc"
              onSort={mockOnSort}
            />
          </tr>
        </thead>
      </table>,
    )

    const icon = screen.getByTestId('icon')
    expect(icon).toHaveAttribute('data-icon', 'sort-up')
  })

  it('renders with descending sort', () => {
    render(
      <table>
        <thead>
          <tr>
            <SortableHeader
              column="name"
              label="Name"
              sortBy="name"
              sortDirection="desc"
              onSort={mockOnSort}
            />
          </tr>
        </thead>
      </table>,
    )

    const icon = screen.getByTestId('icon')
    expect(icon).toHaveAttribute('data-icon', 'sort-down')
  })

  it('calls onSort when clicked', () => {
    render(
      <table>
        <thead>
          <tr>
            <SortableHeader
              column="name"
              label="Name"
              sortBy={null}
              sortDirection="asc"
              onSort={mockOnSort}
            />
          </tr>
        </thead>
      </table>,
    )

    fireEvent.click(screen.getByText('Name'))
    expect(mockOnSort).toHaveBeenCalledWith('name')
  })

  it('calls onSort when Enter key is pressed', () => {
    render(
      <table>
        <thead>
          <tr>
            <SortableHeader
              column="name"
              label="Name"
              sortBy={null}
              sortDirection="asc"
              onSort={mockOnSort}
            />
          </tr>
        </thead>
      </table>,
    )

    const header = screen.getByText('Name').closest('th')
    fireEvent.keyDown(header, { key: 'Enter' })
    expect(mockOnSort).toHaveBeenCalledWith('name')
  })

  it('calls onSort when Space key is pressed', () => {
    render(
      <table>
        <thead>
          <tr>
            <SortableHeader
              column="name"
              label="Name"
              sortBy={null}
              sortDirection="asc"
              onSort={mockOnSort}
            />
          </tr>
        </thead>
      </table>,
    )

    const header = screen.getByText('Name').closest('th')
    fireEvent.keyDown(header, { key: ' ' })
    expect(mockOnSort).toHaveBeenCalledWith('name')
  })

  it('does not call onSort for other keys', () => {
    render(
      <table>
        <thead>
          <tr>
            <SortableHeader
              column="name"
              label="Name"
              sortBy={null}
              sortDirection="asc"
              onSort={mockOnSort}
            />
          </tr>
        </thead>
      </table>,
    )

    const header = screen.getByText('Name').closest('th')
    fireEvent.keyDown(header, { key: 'Tab' })
    expect(mockOnSort).not.toHaveBeenCalled()
  })

  it('has correct aria attributes when unsorted', () => {
    render(
      <table>
        <thead>
          <tr>
            <SortableHeader
              column="name"
              label="Name"
              sortBy={null}
              sortDirection="asc"
              onSort={mockOnSort}
            />
          </tr>
        </thead>
      </table>,
    )

    const header = screen.getByText('Name').closest('th')
    expect(header).toHaveAttribute('aria-sort', 'none')
    expect(header).toHaveAttribute('aria-label', 'Sort by Name, currently unsorted')
  })

  it('has correct aria attributes when sorted ascending', () => {
    render(
      <table>
        <thead>
          <tr>
            <SortableHeader
              column="name"
              label="Name"
              sortBy="name"
              sortDirection="asc"
              onSort={mockOnSort}
            />
          </tr>
        </thead>
      </table>,
    )

    const header = screen.getByText('Name').closest('th')
    expect(header).toHaveAttribute('aria-sort', 'ascending')
    expect(header).toHaveAttribute('aria-label', 'Sort by Name, currently ascending')
  })

  it('has correct aria attributes when sorted descending', () => {
    render(
      <table>
        <thead>
          <tr>
            <SortableHeader
              column="name"
              label="Name"
              sortBy="name"
              sortDirection="desc"
              onSort={mockOnSort}
            />
          </tr>
        </thead>
      </table>,
    )

    const header = screen.getByText('Name').closest('th')
    expect(header).toHaveAttribute('aria-sort', 'descending')
    expect(header).toHaveAttribute('aria-label', 'Sort by Name, currently descending')
  })

  it('applies custom className', () => {
    render(
      <table>
        <thead>
          <tr>
            <SortableHeader
              column="name"
              label="Name"
              sortBy={null}
              sortDirection="asc"
              onSort={mockOnSort}
              className="custom-class"
            />
          </tr>
        </thead>
      </table>,
    )

    const header = screen.getByText('Name').closest('th')
    expect(header).toHaveClass('custom-class')
  })

  it('applies custom style', () => {
    render(
      <table>
        <thead>
          <tr>
            <SortableHeader
              column="name"
              label="Name"
              sortBy={null}
              sortDirection="asc"
              onSort={mockOnSort}
              style={{ width: '200px' }}
            />
          </tr>
        </thead>
      </table>,
    )

    const header = screen.getByText('Name').closest('th')
    expect(header).toHaveStyle({ width: '200px', cursor: 'pointer' })
  })
})
