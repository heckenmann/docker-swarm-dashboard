import { render, screen, fireEvent } from '@testing-library/react'
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
  currentVariantAtom: 'currentVariantAtom',
  isDarkModeAtom: 'isDarkModeAtom',
}))

jest.mock('../../../src/common/store/atoms/dashboardAtoms', () => ({
  dashboardHAtom: 'dashboardHAtom',
}))

jest.mock('../../../src/common/store/atoms/navigationAtoms', () => ({
  viewAtom: 'viewAtom',
}))

jest.mock('../../../src/common/store/atoms/uiAtoms', () => ({
  hiddenServiceStatesAtom: 'hiddenServiceStatesAtom',
  serviceNameFilterAtom: 'serviceNameFilterAtom',
  stackNameFilterAtom: 'stackNameFilterAtom',
  tableSizeAtom: 'tableSizeAtom',
}))

jest.mock('../../../src/common/navigationConstants', () => ({
  servicesDetailId: 'servicesDetail',
  tasksDetailId: 'tasksDetail',
}))

// Mock jotai
const mockUseAtomValue = jest.fn()
const mockUseAtom = jest.fn()
jest.mock('jotai', () => ({
  useAtomValue: (atom) => mockUseAtomValue(atom),
  useAtom: (atom) => mockUseAtom(atom),
}))

// Mock components
jest.mock('../../../src/components/shared/names/NodeName', () => ({ name }) => <div data-testid="node-name">{name}</div>)
const MockServiceName = jest.fn(({ name, onClick }) => (
  <div data-testid="service-name" onClick={onClick}>
    {name}
  </div>
))
jest.mock('../../../src/components/shared/names/ServiceName', () => MockServiceName)
jest.mock('../../../src/components/services/ServiceStatusBadge.jsx', () => () => <div data-testid="service-status-badge" />)
jest.mock('../../../src/components/dashboard/DashboardSettingsComponent', () => () => <div data-testid="dashboard-settings" />)
jest.mock('../../../src/components/common/DSDCard', () => ({ title, body, headerActions }) => (
  <div data-testid="dsd-card">
    <div data-testid="card-title">{title}</div>
    {headerActions}
    <div data-testid="card-body">{body}</div>
  </div>
))

const DashboardComponent = require('../../../src/components/dashboard/DashboardComponent').default

describe('DashboardComponent', () => {
  beforeEach(() => {
    mockUseAtomValue.mockReset()
    mockUseAtom.mockReset()
  })

  const mockDashboardData = {
    Services: [
      { ID: 's1', Name: 'service1', Stack: 'stack1' },
    ],
    Nodes: [
      {
        ID: 'n1',
        Hostname: 'node1',
        Role: 'manager',
        StatusState: 'ready',
        Availability: 'active',
        IP: '1.2.3.4',
        Tasks: {
          s1: [{ ID: 't1', Status: { State: 'running' } }]
        }
      },
    ],
  }

  const setupMocks = (overrides = {}) => {
    const defaults = {
      currentVariantAtom: 'light',
      isDarkModeAtom: false,
      dashboardHAtom: mockDashboardData,
      hiddenServiceStatesAtom: [],
      serviceNameFilterAtom: '',
      stackNameFilterAtom: '',
      tableSizeAtom: 'sm',
    }
    const config = { ...defaults, ...overrides }
    mockUseAtomValue.mockImplementation((atom) => config[atom])
    mockUseAtom.mockImplementation((atom) => [null, jest.fn()])
  }

  test('renders dashboard with nodes and services', () => {
    setupMocks()
    render(<DashboardComponent />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('node-name')).toHaveTextContent('node1')
    expect(screen.getByTestId('service-name')).toHaveTextContent('service1')
    expect(screen.getByTestId('service-status-badge')).toBeInTheDocument()
  })

  test('filters services by name', () => {
    setupMocks({ serviceNameFilterAtom: 'non-existent' })
    render(<DashboardComponent />)
    expect(screen.queryByTestId('service-name')).not.toBeInTheDocument()
  })

  test('navigates to service detail on click', () => {
    const mockUpdateView = jest.fn()
    setupMocks()
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'viewAtom') return [null, mockUpdateView]
      return [null, jest.fn()]
    })
    render(<DashboardComponent />)

    // The header is in row 0, 1 or 2. index 0 is row 0.
    const serviceNameElement = screen.getByText('service1')
    fireEvent.click(serviceNameElement)

    expect(mockUpdateView).toHaveBeenCalled()
    const updateFn = mockUpdateView.mock.calls[0][0]
    const result = updateFn({ some: 'prev' })
    expect(result.id).toBe('servicesDetail')
    expect(result.detail).toBe('s1')
  })

  test('navigates to task detail on click and keydown', () => {
    const mockUpdateView = jest.fn()
    setupMocks()
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'viewAtom') return [null, mockUpdateView]
      return [null, jest.fn()]
    })
    render(<DashboardComponent />)

    const taskItem = screen.getByRole('button')
    fireEvent.click(taskItem)
    expect(mockUpdateView).toHaveBeenCalledWith(expect.objectContaining({
      id: 'tasksDetail',
      detail: 't1'
    }))

    mockUpdateView.mockClear()
    fireEvent.keyDown(taskItem, { key: 'Enter' })
    expect(mockUpdateView).toHaveBeenCalled()

    mockUpdateView.mockClear()
    fireEvent.keyDown(taskItem, { key: ' ' })
    expect(mockUpdateView).toHaveBeenCalled()
  })

  test('handles multiple service headers across rows', () => {
    setupMocks({
      dashboardHAtom: {
        Services: [
          { ID: 's1', Name: 'service1' },
          { ID: 's2', Name: 'service2' },
          { ID: 's3', Name: 'service3' },
          { ID: 's4', Name: 'service4' },
        ],
        Nodes: [],
      }
    })
    render(<DashboardComponent />)
    expect(screen.getAllByTestId('service-name')).toHaveLength(4)
  })

  test('renders different node states and attributes', () => {
    setupMocks({
      dashboardHAtom: {
        Services: [],
        Nodes: [
          {
            ID: 'n1',
            Hostname: 'node1',
            Role: 'manager',
            StatusState: 'down',
            Availability: 'active',
            Leader: true,
            IP: '1.1.1.1'
          },
          {
            ID: 'n2',
            Hostname: 'node2',
            Role: 'worker',
            StatusState: 'ready',
            Availability: 'drain',
            IP: '2.2.2.2'
          },
          {
            ID: 'n3',
            Hostname: 'node3',
            Role: 'worker',
            StatusState: 'unknown',
            Availability: 'active',
            IP: '3.3.3.3'
          }
        ]
      }
    })
    render(<DashboardComponent />)
    expect(screen.getByText('Down')).toBeInTheDocument()
    expect(screen.getByText('Ready')).toBeInTheDocument()
    expect(screen.getByText('drain')).toBeInTheDocument()
    expect(screen.getByText('1.1.1.1')).toBeInTheDocument()
  })

  test('handles missing tasks or status', () => {
    setupMocks({
      dashboardHAtom: {
        Services: [{ ID: 's1', Name: 's1' }],
        Nodes: [{
          ID: 'n1',
          Tasks: {
            s1: [{ ID: 't1' }] // missing Status
          }
        }]
      }
    })
    render(<DashboardComponent />)
    expect(screen.getByTestId('service-status-badge')).toBeInTheDocument()
  })

  test('renders multiple nodes and tasks completely', () => {
    setupMocks({
      dashboardHAtom: {
        Services: [
          { ID: 's1', Name: 'service1' },
          { ID: 's2', Name: 'service2' },
        ],
        Nodes: [
          {
            ID: 'n1',
            Hostname: 'node1',
            StatusState: 'ready',
            Tasks: {
              s1: [{ ID: 't1', Status: { State: 'running', Timestamp: '2023' } }],
              s2: [{ ID: 't2', Status: { State: 'stopped' } }]
            }
          },
          {
            ID: null, // node-unknown
            Hostname: 'node2',
            StatusState: 'down',
            Tasks: {
              s1: [{ ID: 't3' }] // task-idx-0, status-idx-0
            }
          }
        ]
      }
    })
    render(<DashboardComponent />)
    expect(screen.getAllByTestId('service-status-badge')).toHaveLength(3)
  })

  test('covers all branch logic in table rows', () => {
    setupMocks({
      dashboardHAtom: {
        Services: [{ ID: 's1', Name: 's1' }],
        Nodes: [
          {
            ID: 'n1',
            StatusState: 'unknown',
            Availability: 'drain',
          }
        ]
      }
    })
    render(<DashboardComponent />)
    expect(screen.getByText('unknown')).toBeInTheDocument()
    expect(screen.getByText('drain')).toBeInTheDocument()
  })

  test('handles dark mode table variant', () => {
    setupMocks({ isDarkModeAtom: true, currentVariantAtom: 'dark' })
    render(<DashboardComponent />)
    const table = screen.getByRole('table')
    expect(table).toHaveClass('table-dark')
  })

  test('covers all headers and filler logic', () => {
    setupMocks({
      dashboardHAtom: {
        Services: [
          { ID: 's1', Name: 's1' },
          { ID: 's2', Name: 's2' },
          { ID: 's3', Name: 's3' },
          { ID: 's4', Name: 's4' },
          { ID: 's5', Name: 's5' },
          { ID: 's6', Name: 's6' },
        ],
        Nodes: []
      }
    })
    render(<DashboardComponent />)
    // row 0: s1, s4 (idx 0, 3)
    // row 1: s2, s5 (idx 1, 4)
    // row 2: s3, s6 (idx 2, 5)
    expect(screen.getAllByTestId('service-name')).toHaveLength(6)
  })

  test('handles empty dashboard data', () => {
    setupMocks({ dashboardHAtom: null })
    render(<DashboardComponent />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })
})
