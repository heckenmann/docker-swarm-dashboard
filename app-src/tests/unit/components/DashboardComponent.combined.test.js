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
})
