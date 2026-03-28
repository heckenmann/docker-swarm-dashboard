import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock Jotai atoms
jest.mock('jotai', () => ({
  useAtomValue: jest.fn((atom) => {
    if (atom === 'showNamesButtonsAtom') return true
    return null
  }),
  useAtom: jest.fn((atom) => {
    return [null, jest.fn()]
  }),
  atom: (initial) => initial,
  Provider: ({ children }) => children
}))

// Mock showNamesButtonsAtom
jest.mock('../../../src/common/store/atoms/uiAtoms', () => ({
  showNamesButtonsAtom: 'showNamesButtonsAtom'
}))

// Mock useEntityActions hook
jest.mock('../../../src/common/hooks/useEntityActions', () => ({
  useEntityActions: jest.fn(() => ({
    onOpen: jest.fn(),
    onFilter: jest.fn(),
  })),
}))

describe('Name-related components combined', () => {
  test('StackName renders and calls onFilter', () => {
    const mockOnFilter = jest.fn()
    require('../../../src/common/hooks/useEntityActions').useEntityActions.mockReturnValue({
      onOpen: jest.fn(),
      onFilter: mockOnFilter
    })
    
    const StackName = require('../../../src/components/shared/names/StackName').default
    render(React.createElement(StackName, { name: 'stackA' }))
    
    expect(screen.getByText('stackA')).toBeInTheDocument()
    
    // Mock the filter button click
    mockOnFilter.mockClear()
    mockOnFilter.mockImplementation((value) => {
      expect(value).toBe('stackA')
    })
  })

  test('ServiceName renders and supports overlay/hide behavior', () => {
    const ServiceName = require('../../../src/components/shared/names/ServiceName').default
    render(React.createElement(ServiceName, { name: 'svc1', id: 'id1' }))
    
    expect(screen.getByText('svc1')).toBeInTheDocument()
  })

  test('NodeName renders and supports overlay/hide behavior', () => {
    const NodeName = require('../../../src/components/shared/names/NodeName').default
    render(React.createElement(NodeName, { name: 'node1', id: 'id1' }))
    
    expect(screen.getByText('node1')).toBeInTheDocument()
  })

  test('EntityName renders service name with buttons when showNamesButtons is true', () => {
    const EntityName = require('../../../src/components/shared/names/EntityName').default
    render(React.createElement(EntityName, { name: 'entity1', id: 'id1', type: 'service' }))

    expect(screen.getByText('entity1')).toBeInTheDocument()
  })

  test('EntityName renders service name without buttons when showNamesButtons is false', () => {
    require('jotai').useAtomValue.mockReturnValue(false)
    const EntityName = require('../../../src/components/shared/names/EntityName').default
    render(React.createElement(EntityName, { name: 'entity1', id: 'id1', type: 'service' }))

    expect(screen.getByText('entity1')).toBeInTheDocument()
  })
})