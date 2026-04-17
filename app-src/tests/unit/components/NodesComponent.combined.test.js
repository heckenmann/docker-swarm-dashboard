import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

jest.mock('../../../src/common/store/atoms/themeAtoms', () => ({
  currentVariantAtom: 'currentVariantAtom',
  currentVariantClassesAtom: 'currentVariantClassesAtom',
}))

jest.mock('../../../src/common/store/atoms/uiAtoms', () => ({
  tableSizeAtom: 'tableSizeAtom',
  showNamesButtonsAtom: 'showNamesButtonsAtom',
}))

jest.mock('../../../src/common/store/atoms/navigationAtoms', () => ({
  viewAtom: 'viewAtom',
}))

jest.mock('../../../src/common/store/atoms/dashboardAtoms', () => ({
  nodesAtomNew: { debugLabel: 'nodesAtomNew' },
  clusterMetricsAtom: { debugLabel: 'clusterMetricsAtom' },
}))

// provide mockable hooks
const mockUseAtomValue = jest.fn()
const mockUseAtom = jest.fn()
jest.mock('jotai', () => ({
  useAtomValue: (...args) => mockUseAtomValue(...args),
  useAtom: (...args) => mockUseAtom(...args),
}))

// Mock ClusterMetricsHeader
jest.mock('../../../src/components/nodes/ClusterMetricsHeader', () => {
  return () => <div data-testid="cluster-header">Cluster Header</div>
})

const modNodes = require('../../../src/components/nodes/NodesComponent')
const NodesComponent = modNodes.default

describe('NodesComponent (combined)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseAtomValue.mockImplementation((atom) => {
      const id = typeof atom === 'string' ? atom : atom?.debugLabel
      if (id === 'showNamesButtonsAtom') return true
      if (id === 'currentVariantAtom') return 'light'
      if (id === 'tableSizeAtom') return 'sm'
      if (id === 'nodesAtomNew') return []
      return null
    })
    
    mockUseAtom.mockImplementation((atom) => {
      if ((typeof atom === 'string' ? atom : atom?.debugLabel) === 'viewAtom') return [{}, jest.fn()]
      return [null, jest.fn()]
    })
  })

  test('renders all node states (Ready, Down, Unknown)', () => {
    const nodes = [
      { ID: 'n1', Hostname: 'node1', State: 'ready', Availability: 'active' },
      { ID: 'n2', Hostname: 'node2', State: 'down', Availability: 'drain' },
      { ID: 'n3', Hostname: 'node3', State: 'starting', Availability: 'pause' },
    ]
    mockUseAtomValue.mockImplementation((atom) => {
      if ((typeof atom === 'string' ? atom : atom?.debugLabel) === 'nodesAtomNew') return nodes
      return 'sm'
    })
    render(<NodesComponent />)
    expect(screen.getByText('Ready')).toBeInTheDocument()
    expect(screen.getByText('Down')).toBeInTheDocument()
    expect(screen.getByText('starting')).toBeInTheDocument()
  })

  test('clicking column headers calls setView', () => {
    const mockSetView = jest.fn()
    mockUseAtom.mockReturnValue([{ sortBy: null, sortDirection: 'asc' }, mockSetView])
    render(<NodesComponent />)
    
    fireEvent.click(screen.getByText('Node'))
    expect(mockSetView).toHaveBeenCalled()
    let updater = mockSetView.mock.calls[0][0]
    expect(updater({})).toEqual(expect.objectContaining({ sortBy: 'Hostname', sortDirection: 'asc' }))
  })
})
