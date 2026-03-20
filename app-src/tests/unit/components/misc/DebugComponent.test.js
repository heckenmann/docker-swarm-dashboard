/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { DebugComponent } from '../../../../src/components/misc/DebugComponent'

// Mock jotai
const mockAtomValue = {}
jest.mock('jotai', () => ({
  useAtomValue: (atom) => mockAtomValue[atom],
  atom: (v) => v,
}))

// Mock the atom
jest.mock('../../../../src/common/store/atoms', () => ({
  swarmApiStatusAtom: { toString: () => 'swarmApiStatusAtom' },
}))

// Mock JsonTable
jest.mock('../../../../src/components/shared/JsonTable', () => ({
  JsonTable: ({ data }) => <div data-testid="json-table">{JSON.stringify(data)}</div>,
}))

// Mock react-bootstrap
jest.mock('react-bootstrap', () => ({
  Alert: ({ children, variant }) => <div data-testid={`alert-${variant}`}>{children}</div>,
  Spinner: () => <div data-testid="spinner">Loading...</div>,
}))

describe('DebugComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders loading state', () => {
    mockAtomValue.swarmApiStatusAtom = { loading: true }
    render(<DebugComponent />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders error state', () => {
    mockAtomValue.swarmApiStatusAtom = {
      loading: false,
      error: { code: 500, message: 'Server Error' },
    }
    render(<DebugComponent />)
    expect(screen.getByTestId('alert-danger')).toBeInTheDocument()
  })

  it('renders success state with data', () => {
    mockAtomValue.swarmApiStatusAtom = {
      loading: false,
      error: null,
      data: { version: '1.0.0', status: 'ok' },
    }
    render(<DebugComponent />)
    expect(screen.getByTestId('json-table')).toBeInTheDocument()
    expect(screen.getByText(/"version": "1.0.0"/)).toBeInTheDocument()
  })

  it('renders without error when error is null', () => {
    mockAtomValue.swarmApiStatusAtom = {
      loading: false,
      error: null,
      data: { test: 'data' },
    }
    render(<DebugComponent />)
    expect(screen.queryByTestId('alert-danger')).not.toBeInTheDocument()
    expect(screen.getByTestId('json-table')).toBeInTheDocument()
  })

  it('handles missing data gracefully', () => {
    mockAtomValue.swarmApiStatusAtom = {
      loading: false,
      error: null,
      data: null,
    }
    render(<DebugComponent />)
    expect(screen.getByTestId('json-table')).toBeInTheDocument()
  })
})
