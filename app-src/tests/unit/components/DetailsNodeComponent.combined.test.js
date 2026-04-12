import { render, screen } from '@testing-library/react'
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
  nodeDetailAtom: 'nodeDetailAtom',
}))

// Mock jotai
const mockUseAtomValue = jest.fn()
jest.mock('jotai', () => ({
  useAtomValue: (atom) => mockUseAtomValue(atom),
}))

// Mock components
jest.mock('../../../src/components/nodes/NodeMetricsComponent', () => () => <div data-testid="node-metrics" />)
jest.mock('../../../src/components/nodes/details/NodeTasksTab', () => () => <div data-testid="node-tasks-tab" />)
jest.mock('../../../src/components/shared/JsonTable.jsx', () => () => <div data-testid="json-table" />)

const DetailsNodeComponent = require('../../../src/components/nodes/DetailsNodeComponent').default

describe('DetailsNodeComponent', () => {
  beforeEach(() => {
    mockUseAtomValue.mockReset()
  })

  const mockNodeData = {
    node: {
      ID: 'n1',
      Description: { Hostname: 'node1' }
    }
  }

  test('renders node details with tabs', () => {
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'currentVariantClassesAtom') return 'classes'
      if (atom === 'nodeDetailAtom') return mockNodeData
      return null
    })

    render(<DetailsNodeComponent />)

    expect(screen.getByText(/Node "node1"/)).toBeInTheDocument()
    expect(screen.getByText('Metrics')).toBeInTheDocument()
    expect(screen.getByText('Tasks')).toBeInTheDocument()
    expect(screen.getByText('Table')).toBeInTheDocument()
    expect(screen.getByText('JSON')).toBeInTheDocument()
    
    // Default tab is metrics
    expect(screen.getByTestId('node-metrics')).toBeInTheDocument()
  })

  test('renders message when node not found', () => {
    mockUseAtomValue.mockImplementation((atom) => null)
    render(<DetailsNodeComponent />)
    expect(screen.getByText(/Node doesn't exist/)).toBeInTheDocument()
  })
})
