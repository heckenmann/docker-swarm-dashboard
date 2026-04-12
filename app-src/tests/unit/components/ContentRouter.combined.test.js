import { render, screen } from '@testing-library/react'
import React from 'react'

// Mock atoms
jest.mock('../../../src/common/store/atoms/navigationAtoms', () => ({
  viewAtom: 'viewAtom',
}))

jest.mock('../../../src/common/store/atoms/dashboardAtoms', () => ({
  dashboardSettingsDefaultLayoutViewIdAtom: 'dashboardSettingsDefaultLayoutViewIdAtom',
}))

// Mock jotai
const mockUseAtomValue = jest.fn()
jest.mock('jotai', () => ({
  useAtomValue: (atom) => {
    if (atom && atom.__loadable) {
      const value = mockUseAtomValue(atom.__loadable)
      if (value && typeof value === 'object' && value.state) return value
      return { state: 'hasData', data: value }
    }
    return mockUseAtomValue(atom)
  },
}))

jest.mock('jotai/utils', () => ({
  loadable: (atom) => ({ __loadable: atom }),
}))

// Mock all components to test routing logic only
jest.mock('../../../src/components/dashboard/DashboardComponent', () => () => <div data-testid="dashboard-h" />)
jest.mock('../../../src/components/dashboard/DashboardVerticalComponent', () => () => <div data-testid="dashboard-v" />)
jest.mock('../../../src/components/timeline/TimelineComponent.jsx', () => () => <div data-testid="timeline" />)
jest.mock('../../../src/components/services/DetailsServiceComponent', () => () => <div data-testid="service-details" />)
jest.mock('../../../src/components/stacks/StacksComponent', () => () => <div data-testid="stacks" />)
jest.mock('../../../src/components/ports/PortsComponent', () => () => <div data-testid="ports" />)
jest.mock('../../../src/components/nodes/NodesComponent', () => () => <div data-testid="nodes" />)
jest.mock('../../../src/components/nodes/DetailsNodeComponent', () => () => <div data-testid="node-details" />)
jest.mock('../../../src/components/tasks/TasksComponent', () => () => <div data-testid="tasks" />)
jest.mock('../../../src/components/tasks/DetailsTaskComponent.jsx', () => () => <div data-testid="task-details" />)
jest.mock('../../../src/components/misc/AboutComponent', () => () => <div data-testid="about" />)
jest.mock('../../../src/components/settings/SettingsComponent', () => () => <div data-testid="settings" />)
jest.mock('../../../src/components/logs/LogsComponent.jsx', () => () => <div data-testid="logs" />)
jest.mock('../../../src/components/misc/DebugComponent', () => () => <div data-testid="debug" />)
jest.mock('../../../src/components/misc/VersionUpdateComponent.jsx', () => () => <div data-testid="version-update" />)

const ContentRouter = require('../../../src/components/layout/ContentRouter').default

describe('ContentRouter', () => {
  beforeEach(() => {
    mockUseAtomValue.mockReset()
  })

  test('renders dashboard by default', () => {
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'viewAtom') return { id: null }
      if (atom === 'dashboardSettingsDefaultLayoutViewIdAtom') return 'dashboardH'
      return null
    })

    render(<ContentRouter />)
    expect(screen.getByTestId('dashboard-h')).toBeInTheDocument()
  })

  test('routes to Stacks view', () => {
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'viewAtom') return { id: 'stacks' }
      return null
    })

    render(<ContentRouter />)
    expect(screen.getByTestId('stacks')).toBeInTheDocument()
  })

  test('routes to Node details', () => {
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'viewAtom') return { id: 'nodesDetail' }
      return null
    })

    render(<ContentRouter />)
    expect(screen.getByTestId('node-details')).toBeInTheDocument()
  })

  test('renders default dashboard when id is invalid', () => {
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'viewAtom') return { id: 'invalid-id' }
      return null
    })

    render(<ContentRouter />)
    expect(screen.getByTestId('dashboard-h')).toBeInTheDocument()
  })

  test('uses default layout when view id is missing', () => {
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'viewAtom') return { id: null }
      if (atom === 'dashboardSettingsDefaultLayoutViewIdAtom') return 'dashboardV'
      return null
    })

    render(<ContentRouter />)
    expect(screen.getByTestId('dashboard-v')).toBeInTheDocument()
  })

  test('falls back to dashboardH when default layout is loading', () => {
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'viewAtom') return { state: 'loading' }
      if (atom === 'dashboardSettingsDefaultLayoutViewIdAtom') {
        return { state: 'loading' }
      }
      return null
    })

    render(<ContentRouter />)
    expect(screen.getByTestId('dashboard-h')).toBeInTheDocument()
  })

  test('throws when view loadable has error', () => {
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'viewAtom') {
        return { state: 'hasError', error: new Error('view failed') }
      }
      if (atom === 'dashboardSettingsDefaultLayoutViewIdAtom') return 'dashboardH'
      return null
    })

    expect(() => render(<ContentRouter />)).toThrow('view failed')
  })

  test('throws when default layout loadable has error', () => {
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'viewAtom') return { id: null }
      if (atom === 'dashboardSettingsDefaultLayoutViewIdAtom') {
        return { state: 'hasError', error: new Error('layout failed') }
      }
      return null
    })

    expect(() => render(<ContentRouter />)).toThrow('layout failed')
  })
})
