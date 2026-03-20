/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { NameActions } from '../../../../../src/components/shared/names/NameActions'

// Mock FontAwesomeIcon
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }) => <span data-testid={`icon-${icon}`} />,
}))

// Track stopPropagation calls
let stopPropagationMock = null

// Mock react-bootstrap Button
jest.mock('react-bootstrap', () => ({
  Button: ({ children, onClick, title, size, className }) => {
    const handleClick = () => {
      const e = { stopPropagation: () => { stopPropagationMock?.() } }
      onClick && onClick(e)
    }
    return (
      <button onClick={handleClick} title={title} data-size={size} data-class={className}>
        {children}
      </button>
    )
  },
}))

describe('NameActions', () => {
  const mockOnOpen = jest.fn()
  const mockOnFilter = jest.fn()
  const mockOnLogs = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    stopPropagationMock = jest.fn()
  })

  it('renders open button when showOpen=true', () => {
    render(
      <NameActions
        showOpen={true}
        showFilter={false}
        showLogs={false}
        onOpen={mockOnOpen}
      />
    )
    expect(screen.getByTitle(/Open service:/)).toBeInTheDocument()
  })

  it('does not render open button when showOpen=false', () => {
    render(
      <NameActions
        showOpen={false}
        showFilter={false}
        showLogs={false}
        onOpen={mockOnOpen}
      />
    )
    expect(screen.queryByTitle(/Open service:/)).not.toBeInTheDocument()
  })

  it('renders filter button when showFilter=true', () => {
    render(
      <NameActions
        showOpen={false}
        showFilter={true}
        showLogs={false}
        onFilter={mockOnFilter}
      />
    )
    expect(screen.getByTitle(/Filter service:/)).toBeInTheDocument()
  })

  it('does not render filter button when showFilter=false', () => {
    render(
      <NameActions
        showOpen={false}
        showFilter={false}
        showLogs={false}
        onFilter={mockOnFilter}
      />
    )
    expect(screen.queryByTitle(/Filter service:/)).not.toBeInTheDocument()
  })

  it('renders logs button when showLogs=true', () => {
    render(
      <NameActions
        showOpen={false}
        showFilter={false}
        showLogs={true}
        onLogs={mockOnLogs}
      />
    )
    expect(screen.getByTitle(/Show logs for service:/)).toBeInTheDocument()
  })

  it('does not render logs button when showLogs=false', () => {
    render(
      <NameActions
        showOpen={false}
        showFilter={false}
        showLogs={false}
        onLogs={mockOnLogs}
      />
    )
    expect(screen.queryByTitle(/Show logs for service:/)).not.toBeInTheDocument()
  })

  it('calls onOpen when open button is clicked', () => {
    render(
      <NameActions
        showOpen={true}
        showFilter={false}
        showLogs={false}
        onOpen={mockOnOpen}
        id="test-id"
      />
    )
    fireEvent.click(screen.getByTitle(/Open service:/))
    expect(mockOnOpen).toHaveBeenCalledWith("test-id")
  })

  it('calls onFilter when filter button is clicked', () => {
    render(
      <NameActions
        showOpen={false}
        showFilter={true}
        showLogs={false}
        onFilter={mockOnFilter}
        name="test-name"
      />
    )
    fireEvent.click(screen.getByTitle(/Filter service:/))
    expect(mockOnFilter).toHaveBeenCalledWith("test-name")
  })

  it('calls onLogs when logs button is clicked', () => {
    render(
      <NameActions
        showOpen={false}
        showFilter={false}
        showLogs={true}
        onLogs={mockOnLogs}
        id="test-id"
      />
    )
    fireEvent.click(screen.getByTitle(/Show logs for service:/))
    expect(mockOnLogs).toHaveBeenCalledWith("test-id")
  })

  it('calls stopPropagation when open button is clicked', () => {
    render(
      <NameActions
        showOpen={true}
        showFilter={false}
        showLogs={false}
        onOpen={mockOnOpen}
      />
    )
    fireEvent.click(screen.getByTitle(/Open service:/))
    expect(stopPropagationMock).toHaveBeenCalled()
  })

  it('calls stopPropagation when filter button is clicked', () => {
    render(
      <NameActions
        showOpen={false}
        showFilter={true}
        showLogs={false}
        onFilter={mockOnFilter}
        name="test-name"
      />
    )
    fireEvent.click(screen.getByTitle(/Filter service:/))
    expect(stopPropagationMock).toHaveBeenCalled()
  })

  it('calls stopPropagation when logs button is clicked', () => {
    render(
      <NameActions
        showOpen={false}
        showFilter={false}
        showLogs={true}
        onLogs={mockOnLogs}
        id="test-id"
      />
    )
    fireEvent.click(screen.getByTitle(/Show logs for service:/))
    expect(stopPropagationMock).toHaveBeenCalled()
  })

  it('renders with custom entityType', () => {
    render(
      <NameActions
        showOpen={true}
        showFilter={false}
        showLogs={false}
        onOpen={mockOnOpen}
        entityType="node"
      />
    )
    expect(screen.getByTitle(/Open node:/)).toBeInTheDocument()
  })

  it('renders with custom size', () => {
    render(
      <NameActions
        showOpen={true}
        showFilter={false}
        showLogs={false}
        onOpen={mockOnOpen}
        size="lg"
      />
    )
    expect(screen.getByTitle(/Open service:/)).toHaveAttribute('data-size', 'lg')
  })
})
