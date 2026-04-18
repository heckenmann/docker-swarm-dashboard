import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'

// Mock memo to avoid re-render issues in tests
jest.mock('react', () => {
  const original = jest.requireActual('react')
  return {
    ...original,
    memo: (x) => x,
  }
})

// Mock atoms
jest.mock('../../../src/common/store/atoms/themeAtoms', () => ({
  currentVariantClassesAtom: 'currentVariantClassesAtom',
}))

jest.mock('../../../src/common/store/atoms/navigationAtoms', () => ({
  taskDetailAtom: 'taskDetailAtom',
  viewAtom: 'viewAtom',
}))

jest.mock('../../../src/common/store/atoms/foundationAtoms', () => ({
  baseUrlAtom: 'baseUrlAtom',
}))

// Mock jotai
const mockUseAtomValue = jest.fn()
jest.mock('jotai', () => ({
  useAtomValue: (atom) => mockUseAtomValue(atom),
}))

// Mock components
jest.mock('../../../src/components/tasks/details/TaskInfoTable.jsx', () => () => <div data-testid="task-info-table" />)
jest.mock('../../../src/components/tasks/details/TaskMetricsContent.jsx', () => ({ metricsLoading }) => (
  <div data-testid="task-metrics-content">{metricsLoading ? 'Loading' : 'Loaded'}</div>
))
jest.mock('../../../src/components/shared/JsonTable.jsx', () => () => <div data-testid="json-table" />)

// Mock fetch
global.fetch = jest.fn()

const DetailsTaskComponent = require('../../../src/components/tasks/DetailsTaskComponent').default

describe('DetailsTaskComponent', () => {
  beforeEach(() => {
    mockUseAtomValue.mockReset()
    fetch.mockReset()
  })

  const mockTaskData = {
    ID: 't1',
    Status: { State: 'running' }
  }

  test('renders task details with tabs and fetches metrics', async () => {
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'currentVariantClassesAtom') return 'classes'
      if (atom === 'taskDetailAtom') return mockTaskData
      if (atom === 'baseUrlAtom') return 'http://api/'
      if (atom === 'viewAtom') return {}
      return null
    })

    fetch.mockResolvedValue({
      json: async () => ({ available: true, metrics: { cpu: 10 } })
    })

    render(<DetailsTaskComponent />)

    expect(screen.getByText('Task Details')).toBeInTheDocument()
    expect(screen.getByTestId('task-info-table')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByTestId('task-metrics-content')).toHaveTextContent('Loaded')
    })
  })

  test('renders message when task not found', () => {
    mockUseAtomValue.mockImplementation((atom) => null)
    render(<DetailsTaskComponent />)
    expect(screen.getByText(/Task doesn't exist/)).toBeInTheDocument()
  })

  test('handles fetch error', async () => {
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'currentVariantClassesAtom') return 'classes'
      if (atom === 'taskDetailAtom') return mockTaskData
      if (atom === 'baseUrlAtom') return 'http://api/'
      if (atom === 'viewAtom') return {}
      return null
    })

    fetch.mockRejectedValue(new Error('Network error'))

    render(<DetailsTaskComponent />)

    expect(screen.getByText('Task Details')).toBeInTheDocument()
    
    // Should still render without crashing on fetch error
    await waitFor(() => {
      expect(screen.getByTestId('task-metrics-content')).toBeInTheDocument()
    })
  })

  test('handles null task data', () => {
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'currentVariantClassesAtom') return 'classes'
      if (atom === 'taskDetailAtom') return null
      if (atom === 'baseUrlAtom') return 'http://api/'
      if (atom === 'viewAtom') return {}
      return null
    })

    render(<DetailsTaskComponent />)
    expect(screen.getByText(/Task doesn't exist/)).toBeInTheDocument()
  })

  test('renders raw JSON tab', async () => {
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'currentVariantClassesAtom') return 'classes'
      if (atom === 'taskDetailAtom') return mockTaskData
      if (atom === 'baseUrlAtom') return 'http://api/'
      if (atom === 'viewAtom') return {}
      return null
    })

    fetch.mockResolvedValue({
      json: async () => ({ available: false })
    })

    render(<DetailsTaskComponent />)

    // Look for the JSON tab
    expect(screen.getByText('Raw JSON')).toBeInTheDocument()
  })

  test('handles metrics response with error message', async () => {
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'currentVariantClassesAtom') return 'classes'
      if (atom === 'taskDetailAtom') return mockTaskData
      if (atom === 'baseUrlAtom') return 'http://api/'
      if (atom === 'viewAtom') return {}
      return null
    })

    fetch.mockResolvedValue({
      json: async () => ({ available: false, message: 'Custom error message' })
    })

    render(<DetailsTaskComponent />)

    await waitFor(() => {
      expect(screen.getByTestId('task-metrics-content')).toBeInTheDocument()
    })
  })
})
