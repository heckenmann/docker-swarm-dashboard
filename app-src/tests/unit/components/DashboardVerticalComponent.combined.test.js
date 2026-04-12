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

jest.mock('../../../src/common/store/atoms/foundationAtoms', () => ({
  dashboardSettingsAtom: 'dashboardSettingsAtom',
}))

jest.mock('../../../src/common/store/atoms/dashboardAtoms', () => ({
  dashboardVAtom: 'dashboardVAtom',
}))

jest.mock('../../../src/common/store/atoms/navigationAtoms', () => ({
  viewAtom: 'viewAtom',
}))

jest.mock('../../../src/common/store/atoms/uiAtoms', () => ({
  serviceNameFilterAtom: 'serviceNameFilterAtom',
  stackNameFilterAtom: 'stackNameFilterAtom',
  tableSizeAtom: 'tableSizeAtom',
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
jest.mock('../../../src/components/shared/names/ServiceName', () => ({ name }) => <div data-testid="service-name">{name}</div>)
jest.mock('../../../src/components/shared/names/StackName', () => ({ name }) => <div data-testid="stack-name">{name}</div>)
jest.mock('../../../src/components/services/ServiceStatusBadge.jsx', () => () => <div data-testid="service-status-badge" />)
jest.mock('../../../src/components/dashboard/DashboardSettingsComponent', () => () => <div data-testid="dashboard-settings" />)
jest.mock('../../../src/components/common/DSDCard', () => ({ title, body, headerActions }) => (
  <div data-testid="dsd-card">
    <div data-testid="card-title">{title}</div>
    {headerActions}
    <div data-testid="card-body">{body}</div>
  </div>
))

const DashboardVerticalComponent = require('../../../src/components/dashboard/DashboardVerticalComponent').default

describe('DashboardVerticalComponent', () => {
  beforeEach(() => {
    mockUseAtomValue.mockReset()
    mockUseAtom.mockReset()
  })

  const mockDashboardData = {
    Nodes: [
      { ID: 'n1', Hostname: 'node1' },
    ],
    Services: [
      {
        ID: 's1',
        Name: 'service1',
        Stack: 'stack1',
        Replication: '1/1',
        Tasks: {
          n1: [{ ID: 't1', Status: { State: 'running' } }]
        }
      },
    ],
  }

  const setupMocks = (overrides = {}) => {
    const defaults = {
      currentVariantAtom: 'light',
      isDarkModeAtom: false,
      dashboardVAtom: mockDashboardData,
      dashboardSettingsAtom: { hiddenServiceStates: [] },
      serviceNameFilterAtom: '',
      stackNameFilterAtom: '',
      tableSizeAtom: 'sm',
    }
    const config = { ...defaults, ...overrides }
    mockUseAtomValue.mockImplementation((atom) => config[atom])
    mockUseAtom.mockImplementation((atom) => [null, jest.fn()])
  }

  test('renders vertical dashboard with nodes and services', () => {
    setupMocks()
    render(<DashboardVerticalComponent />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('node-name')).toHaveTextContent('node1')
    expect(screen.getByTestId('service-name')).toHaveTextContent('service1')
    expect(screen.getByTestId('stack-name')).toHaveTextContent('stack1')
    expect(screen.getByTestId('service-status-badge')).toBeInTheDocument()
  })

  test('filters services by name', () => {
    setupMocks({ serviceNameFilterAtom: 'non-existent' })
    render(<DashboardVerticalComponent />)
    expect(screen.queryByTestId('service-name')).not.toBeInTheDocument()
  })

  test('navigates to task detail on click and keydown', () => {
    const mockSetView = jest.fn()
    setupMocks()
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'viewAtom') return [null, mockSetView]
      return [null, jest.fn()]
    })
    render(<DashboardVerticalComponent />)

    const taskItem = screen.getByRole('button')
    fireEvent.click(taskItem)
    expect(mockSetView).toHaveBeenCalledWith(expect.objectContaining({
      id: 'tasksDetail',
      detail: 't1'
    }))

    mockSetView.mockClear()
    fireEvent.keyDown(taskItem, { key: 'Enter' })
    expect(mockSetView).toHaveBeenCalled()

    mockSetView.mockClear()
    fireEvent.keyDown(taskItem, { key: ' ' })
    expect(mockSetView).toHaveBeenCalled()
  })

  test('handles empty dashboard data', () => {
    setupMocks({ dashboardVAtom: null })
    render(<DashboardVerticalComponent />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  test('handles missing tasks or node ID', () => {
    setupMocks({
      dashboardVAtom: {
        Nodes: [{ ID: null, Hostname: 'node1' }],
        Services: [{ ID: 's1', Name: 's1', Tasks: { 'null': [{ ID: 't1' }] } }]
      }
    })
    render(<DashboardVerticalComponent />)
    expect(screen.getByTestId('service-status-badge')).toBeInTheDocument()
  })

  test('covers more branch logic', () => {
    setupMocks({
      dashboardVAtom: {
        Nodes: [
          { ID: 'n1', Hostname: 'node1' },
          { ID: 'n2', Hostname: 'node2' }
        ],
        Services: [
          { ID: 's1', Name: 's1' }
        ]
      }
    })
    render(<DashboardVerticalComponent />)
    expect(screen.getAllByTestId('node-name')).toHaveLength(2)
  })
})
