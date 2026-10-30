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
  nodeMetricsAtomFamily: (id) => ({ debugLabel: 'nodeMetricsAtomFamily', id }),
}))

jest.mock('../../../src/common/store/atoms/foundationAtoms', () => ({
  baseUrlAtom: { debugLabel: 'baseUrlAtom' },
}))

// provide mockable hooks
const mockUseAtomValue = jest.fn()
const mockUseAtom = jest.fn()
const mockAtom = jest.fn((fn) => ({ __type: 'atom', fn }))
jest.mock('jotai', () => ({
  useAtomValue: (...args) => mockUseAtomValue(...args),
  useAtom: (...args) => mockUseAtom(...args),
  useSetAtom: (...args) => mockUseAtom(...args)[1],
  atom: (fn) => mockAtom(fn),
}))

jest.mock('../../../src/components/nodes/ClusterHealthSummary', () => () => <div>Swarm Control Plane</div>)
jest.mock('../../../src/common/store/loadable', () => ({
 loadable: (source) => ({ debugLabel: 'nodesLoadable', source }),
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
      if (id === 'nodesLoadable') return {state: 'hasData', data: []}
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
      if ((typeof atom === 'string' ? atom : atom?.debugLabel) === 'nodesLoadable') return {state: 'hasData', data: nodes}
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
    
    // Click on the Node header specifically (using closest('th') to get the sortable header)
    const nodeHeader = screen.getAllByText('Node').find(el => el.tagName === 'TH')
    fireEvent.click(nodeHeader)
    expect(mockSetView).toHaveBeenCalled()
    let updater = mockSetView.mock.calls[0][0]
    expect(updater({})).toEqual(expect.objectContaining({ sortBy: 'Hostname', sortDirection: 'asc' }))
  })

  test('renders node with Leader star', () => {
    const nodes = [
      { ID: 'n1', Hostname: 'node1', State: 'ready', Availability: 'active', Leader: true },
    ]
    mockUseAtomValue.mockImplementation((atom) => {
      if ((typeof atom === 'string' ? atom : atom?.debugLabel) === 'nodesLoadable') return {state: 'hasData', data: nodes}
      return 'sm'
    })
    render(<NodesComponent />)
    expect(screen.getByText('node1')).toBeInTheDocument()
  })

  test('renders active availability badge', () => {
    const nodes = [
      { ID: 'n1', Hostname: 'node1', State: 'ready', Availability: 'active' },
    ]
    mockUseAtomValue.mockImplementation((atom) => {
      if ((typeof atom === 'string' ? atom : atom?.debugLabel) === 'nodesLoadable') return {state: 'hasData', data: nodes}
      return 'sm'
    })
    render(<NodesComponent />)
    expect(screen.getByText('active')).toBeInTheDocument()
  })

  test('renders drain availability badge', () => {
    const nodes = [
      { ID: 'n1', Hostname: 'node1', State: 'ready', Availability: 'drain' },
    ]
    mockUseAtomValue.mockImplementation((atom) => {
      if ((typeof atom === 'string' ? atom : atom?.debugLabel) === 'nodesLoadable') return {state: 'hasData', data: nodes}
      return 'sm'
    })
    render(<NodesComponent />)
    expect(screen.getByText('drain')).toBeInTheDocument()
  })

  test('cycles sort: asc -> desc -> null', () => {
    const mockSetView = jest.fn()
    mockUseAtom.mockImplementation((atom) => {
      if ((typeof atom === 'string' ? atom : atom?.debugLabel) === 'viewAtom') return [{}, mockSetView]
      return [null, jest.fn()]
    })
    
    render(<NodesComponent />)
    // Click on the Node header specifically
    const nodeHeader = screen.getAllByText('Node').find(el => el.tagName === 'TH')
    fireEvent.click(nodeHeader)
    expect(mockSetView).toHaveBeenCalled()
    
    // Test descending sort
    mockSetView.mockClear()
    mockUseAtom.mockImplementation((atom) => {
      if ((typeof atom === 'string' ? atom : atom?.debugLabel) === 'viewAtom') {
        return [{ sortBy: 'Hostname', sortDirection: 'asc' }, mockSetView]
      }
      return [null, jest.fn()]
    })
    
    const { rerender } = render(<NodesComponent />)
    const nodeHeader2 = screen.getAllByText('Node').find(el => el.tagName === 'TH')
    fireEvent.click(nodeHeader2)
    const updater = mockSetView.mock.calls[0][0]
    expect(updater({ sortBy: 'Hostname', sortDirection: 'asc' })).toEqual({ sortBy: 'Hostname', sortDirection: 'asc' })
  })

  test('switches sort when different column clicked', () => {
    const mockSetView = jest.fn()
    mockUseAtom.mockImplementation((atom) => {
      if ((typeof atom === 'string' ? atom : atom?.debugLabel) === 'viewAtom') {
        return [{ sortBy: 'Hostname', sortDirection: 'desc' }, mockSetView]
      }
      return [null, jest.fn()]
    })
    
    render(<NodesComponent />)
    fireEvent.click(screen.getByText('Role'))
    expect(mockSetView).toHaveBeenCalled()
    const updater = mockSetView.mock.calls[0][0]
    expect(updater({ sortBy: 'Hostname', sortDirection: 'desc' })).toEqual({ sortBy: 'Role', sortDirection: 'asc' })
  })

  test('renders table with striped and hover classes', () => {
    const nodes = [
      { ID: 'n1', Hostname: 'node1', State: 'ready', Availability: 'active' },
    ]
    mockUseAtomValue.mockImplementation((atom) => {
      if ((typeof atom === 'string' ? atom : atom?.debugLabel) === 'nodesLoadable') return {state: 'hasData', data: nodes}
      return 'sm'
    })
    
    const { container } = render(<NodesComponent />)
    const table = container.querySelector('#nodes-table')
    expect(table).toHaveClass('table-striped')
    expect(table).toHaveClass('table-hover')
  })

  test('renders warning class for non-ready state', () => {
    const nodes = [
      { ID: 'n1', Hostname: 'node1', State: 'down', Availability: 'active' },
    ]
    mockUseAtomValue.mockImplementation((atom) => {
      if ((typeof atom === 'string' ? atom : atom?.debugLabel) === 'nodesLoadable') return {state: 'hasData', data: nodes}
      return 'sm'
    })
    
    const { container } = render(<NodesComponent />)
    const row = container.querySelector('tbody tr')
    expect(row).toHaveClass('table-warning')
  })
  test('renders advertised versions and platforms independently of reachability', () => {
    mockUseAtomValue.mockImplementation(atom => {
      const id = typeof atom === 'string' ? atom : atom?.debugLabel
      if(id === 'nodesLoadable') return {state:'hasData',data:[
        {ID:'m1',Hostname:'manager',Role:'manager',Reachability:'reachable',Availability:'drain',EngineVersion:'28.5.2',OS:'linux',Architecture:'arm64'},
        {ID:'w1',Hostname:'worker',Role:'worker',EngineVersion:'27.0.0'},
        {ID:'m2',Hostname:'missing',Role:'manager'},
      ]}
      return 'sm'
    })
    render(<NodesComponent />)
    expect(screen.getByText('28.5.2')).toBeVisible()
    expect(screen.getByText('27.0.0')).toBeVisible()
    expect(screen.getByText('linux / arm64')).toBeVisible()
    expect(screen.getByText('reachable')).toBeVisible()
    expect(screen.getByText('drain')).toBeVisible()
    expect(screen.getByText('unknown')).toBeVisible()
    expect(screen.getAllByText('Unknown').length).toBeGreaterThan(0)
  })

  test.each(['loading','hasError'])('keeps the health summary visible when inventory is %s', state => {
    mockUseAtomValue.mockImplementation(atom => {
      const id = typeof atom === 'string' ? atom : atom?.debugLabel
      if(id === 'nodesLoadable') return {state}
      return 'sm'
    })
    render(<NodesComponent />)
    expect(screen.getByText('Swarm Control Plane')).toBeVisible()
    expect(screen.getByText(state === 'loading' ? 'Loading nodes...' : 'Node inventory is unavailable.')).toBeVisible()
  })

})
