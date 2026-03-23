// Combined tests for DashboardNavbar
// Verifies that showNavLabelsAtom, maxContentWidthAtom, and currentVariantAtom
// (driven by isDarkModeAtom) correctly affect the rendered output.
import { render, screen } from '@testing-library/react'
import { Provider } from 'jotai'

// Mock navigation constants
jest.mock('../../../src/common/navigationConstants', () => ({
  aboutId: 'about',
  dashboardHId: 'dashboardH',
  logsId: 'logs',
  nodesId: 'nodes',
  portsId: 'ports',
  settingsId: 'settings',
  stacksId: 'stacks',
  tasksId: 'tasks',
  timelineId: 'timeline',
  versionUpdateId: 'versionUpdate',
}))

// Mock Jotai - use jest.fn() factory pattern to avoid circular dependency
jest.mock('jotai', () => ({
  useAtomValue: jest.fn(),
  useAtom: jest.fn(),
  Provider: ({ children }) => children,
}))

// Mock atoms
jest.mock('../../../src/common/store/atoms', () => ({
  showNavLabelsAtom: 'showNavLabelsAtom',
  maxContentWidthAtom: 'maxContentWidthAtom',
  currentVariantAtom: 'currentVariantAtom',
  refreshIntervalAtom: 'refreshIntervalAtom',
  viewAtom: 'viewAtom',
  versionRefreshAtom: 'versionRefreshAtom',
  versionAtom: { version: '1.0.0' },
}))

// Mock andere Abhängigkeiten
jest.mock('../../../src/common/store/reducers', () => ({
  RefreshIntervalToggleReducer: () => null,
}))

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => null,
}))
jest.mock('@fortawesome/fontawesome-svg-core', () => ({
  library: { add: () => {} },
}))
jest.mock('@fortawesome/free-solid-svg-icons', () => ({}))

const { DashboardNavbar } = require('../../../src/components/layout/DashboardNavbar')

describe('DashboardNavbar', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
    
    // Standard-Mocks für die meisten Tests
    require('jotai').useAtomValue.mockImplementation((atom) => {
      if (atom === 'showNavLabelsAtom') return false
      if (atom === 'maxContentWidthAtom') return 'fluid'
      if (atom === 'currentVariantAtom') return 'light'
      return null
    })
    
    require('jotai').useAtom.mockImplementation((atom) => {
      if (atom === 'refreshIntervalAtom') return [0, jest.fn()]
      if (atom === 'viewAtom') return [{ id: 'dashboardH' }, jest.fn()]
      if (atom === 'versionRefreshAtom') return [0, jest.fn()]
      return [null, jest.fn()]
    })
  })

  it('renders nav links with text labels when showNavLabelsAtom is true', () => {
    // Mock showNavLabelsAtom to return true
    require('jotai').useAtomValue.mockImplementation((atom) => {
      if (atom === 'showNavLabelsAtom') return true
      if (atom === 'maxContentWidthAtom') return 'fluid'
      if (atom === 'currentVariantAtom') return 'light'
      if (atom === 'versionAtom') return { version: '1.0.0' }
      return null
    })

    render(<DashboardNavbar />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Stacks')).toBeInTheDocument()
    expect(screen.getByText('Nodes')).toBeInTheDocument()
    expect(screen.getByText('1.0.0')).toBeInTheDocument()
  })

  it('renders nav links without text labels when showNavLabelsAtom is false', () => {
    // Mock showNavLabelsAtom to return false
    require('jotai').useAtomValue.mockImplementation((atom) => {
      if (atom === 'showNavLabelsAtom') return false
      if (atom === 'maxContentWidthAtom') return 'fluid'
      if (atom === 'currentVariantAtom') return 'light'
      if (atom === 'versionAtom') return { version: '1.0.0' }
      return null
    })

    render(<DashboardNavbar />)
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
    expect(screen.queryByText('Stacks')).not.toBeInTheDocument()
    expect(screen.queryByText('Nodes')).not.toBeInTheDocument()
    expect(screen.getByText('1.0.0')).toBeInTheDocument()
  })

  it('uses container class when maxContentWidthAtom is centered', () => {
    // Mock maxContentWidthAtom to return 'centered'
    require('jotai').useAtomValue.mockImplementation((atom) => {
      if (atom === 'showNavLabelsAtom') return false
      if (atom === 'maxContentWidthAtom') return 'centered'
      if (atom === 'currentVariantAtom') return 'light'
      if (atom === 'versionAtom') return { version: '1.0.0' }
      return null
    })

    render(<DashboardNavbar />)
    expect(screen.getByRole('navigation')).toHaveClass('container')
    expect(screen.getByText('1.0.0')).toBeInTheDocument()
  })

  it('uses container-fluid class when maxContentWidthAtom is fluid', () => {
    // Mock maxContentWidthAtom to return 'fluid'
    require('jotai').useAtomValue.mockImplementation((atom) => {
      if (atom === 'showNavLabelsAtom') return false
      if (atom === 'maxContentWidthAtom') return 'fluid'
      if (atom === 'currentVariantAtom') return 'light'
      if (atom === 'versionAtom') return { version: '1.0.0' }
      return null
    })

    render(<DashboardNavbar />)
    expect(screen.getByRole('navigation')).toHaveClass('container-fluid')
    expect(screen.getByText('1.0.0')).toBeInTheDocument()
  })

  it('applies dark theme classes when isDarkModeAtom is true', () => {
    // Mock currentVariantAtom to return 'dark'
    require('jotai').useAtomValue.mockImplementation((atom) => {
      if (atom === 'showNavLabelsAtom') return true
      if (atom === 'maxContentWidthAtom') return 'fluid'
      if (atom === 'currentVariantAtom') return 'dark'
      if (atom === 'versionAtom') return { version: '1.0.0' }
      return null
    })

    render(<DashboardNavbar />)
    expect(screen.getByRole('navigation')).toHaveClass('navbar-dark', 'bg-dark')
    expect(screen.getByText('1.0.0')).toBeInTheDocument()
  })
})
