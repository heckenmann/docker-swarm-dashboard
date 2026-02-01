// Combined tests for DetailsServiceComponent
import { render, screen, waitFor } from '@testing-library/react'
import { act } from 'react'

// Mock atoms
jest.mock('../../../src/common/store/atoms', () => ({
  currentVariantAtom: 'currentVariantAtom',
  currentVariantClassesAtom: 'currentVariantClassesAtom',
  serviceDetailAtom: 'serviceDetailAtom',
  baseUrlAtom: 'baseUrlAtom',
  viewAtom: 'viewAtom',
}))

// Mock components
jest.mock('../../../src/components/JsonTable', () => ({
  JsonTable: () => <div data-testid="json-table">JsonTable Mock</div>,
}))

jest.mock('../../../src/components/ServiceMetricsComponent', () => ({
  ServiceMetricsComponent: ({ serviceId }) => (
    <div data-testid="service-metrics">ServiceMetrics: {serviceId}</div>
  ),
}))

jest.mock('../../../src/components/names/NodeName', () => ({
  NodeName: ({ name, id }) => (
    <span data-testid="node-name">
      {name || id}
    </span>
  ),
}))

jest.mock('../../../src/components/ServiceStatusBadge', () => ({
  __esModule: true,
  default: ({ serviceState }) => (
    <span data-testid="status-badge">{serviceState}</span>
  ),
}))

jest.mock('../../../src/components/SortableHeader', () => ({
  SortableHeader: ({ label, column }) => <th data-testid={`header-${column}`}>{label}</th>,
}))

jest.mock('../../../src/common/DefaultDateTimeFormat', () => ({
  toDefaultDateTimeString: (date) => date || 'N/A',
}))

// Mock fetch
global.fetch = jest.fn()

const mockUseAtomValue = jest.fn()
jest.mock('jotai', () => ({
  useAtomValue: (...args) => mockUseAtomValue(...args),
}))

const modDetails = require('../../../src/components/DetailsServiceComponent')
const DetailsServiceComponent =
  modDetails.DetailsServiceComponent || modDetails.default || modDetails

describe('DetailsServiceComponent', () => {
  beforeEach(() => {
    mockUseAtomValue.mockReset()
    global.fetch.mockReset()
    jest.clearAllMocks()
  })

  test('renders service not found message when currentService is null', () => {
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'serviceDetailAtom') return null
      return ''
    })

    render(<DetailsServiceComponent />)
    expect(screen.getByText("Service doesn't exist")).toBeInTheDocument()
  })

  test('renders service details with metrics as default tab', () => {
    const mockService = {
      service: {
        ID: 'service-1',
        Spec: { Name: 'test-service' },
      },
      tasks: [],
    }

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'currentVariantAtom':
          return 'light'
        case 'currentVariantClassesAtom':
          return 'card-class'
        case 'serviceDetailAtom':
          return mockService
        case 'baseUrlAtom':
          return 'http://localhost/'
        case 'viewAtom':
          return { timestamp: Date.now() }
        default:
          return ''
      }
    })

    global.fetch.mockResolvedValue({
      json: async () => ({ available: false }),
    })

    render(<DetailsServiceComponent />)

    expect(screen.getByText(/Service "test-service"/)).toBeInTheDocument()
    expect(screen.getByTestId('service-metrics')).toBeInTheDocument()
  })

  test('renders tasks table with metrics columns', async () => {
    const mockService = {
      service: {
        ID: 'service-1',
        Spec: { Name: 'test-service' },
      },
      tasks: [
        {
          ID: 'task-1',
          Spec: { Name: 'test-service.1' },
          NodeID: 'node-1',
          NodeName: 'test-node',
          Status: { State: 'running' },
          CreatedAt: '2024-01-01T00:00:00Z',
          UpdatedAt: '2024-01-01T01:00:00Z',
        },
      ],
    }

    const mockMetrics = {
      available: true,
      metrics: {
        containers: [
          {
            taskName: 'test-service.1',
            containerId: '/docker/abc123def456',
            usage: 256 * 1024 * 1024,
            workingSet: 200 * 1024 * 1024,
            limit: 512 * 1024 * 1024,
            usagePercent: 50,
            cpuUsage: 123.5,
            cpuPercent: 45,
          },
        ],
      },
    }

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'currentVariantAtom':
          return 'light'
        case 'currentVariantClassesAtom':
          return 'card-class'
        case 'serviceDetailAtom':
          return mockService
        case 'baseUrlAtom':
          return 'http://localhost/'
        case 'viewAtom':
          return { timestamp: Date.now() }
        default:
          return ''
      }
    })

    global.fetch.mockResolvedValue({
      json: async () => mockMetrics,
    })

    await act(async () => {
      render(<DetailsServiceComponent />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('node-name')).toHaveTextContent('test-node')
    })

    // Check for metrics columns
    expect(screen.getByTestId('header-NodeName')).toBeInTheDocument()
    expect(screen.getByTestId('header-State')).toBeInTheDocument()
    expect(screen.getByTestId('header-CreatedAt')).toBeInTheDocument()
    expect(screen.getByTestId('header-UpdatedAt')).toBeInTheDocument()
  })

  test('displays metrics data in task rows', async () => {
    const mockService = {
      service: {
        ID: 'service-1',
        Spec: { Name: 'test-service' },
      },
      tasks: [
        {
          ID: 'task-1',
          Spec: { Name: 'test-service.1' },
          NodeID: 'node-1',
          NodeName: 'test-node',
          Status: { State: 'running' },
          CreatedAt: '2024-01-01T00:00:00Z',
          UpdatedAt: '2024-01-01T01:00:00Z',
        },
      ],
    }

    const mockMetrics = {
      available: true,
      metrics: {
        containers: [
          {
            taskName: 'test-service.1',
            containerId: '/docker/abc123def456',
            usage: 256 * 1024 * 1024,
            workingSet: 200 * 1024 * 1024,
            limit: 512 * 1024 * 1024,
            usagePercent: 50,
            cpuUsage: 123.5,
            cpuPercent: 45,
          },
        ],
      },
    }

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'currentVariantAtom':
          return 'light'
        case 'currentVariantClassesAtom':
          return 'card-class'
        case 'serviceDetailAtom':
          return mockService
        case 'baseUrlAtom':
          return 'http://localhost/'
        case 'viewAtom':
          return { timestamp: Date.now() }
        default:
          return ''
      }
    })

    global.fetch.mockResolvedValue({
      json: async () => mockMetrics,
    })

    await act(async () => {
      render(<DetailsServiceComponent />)
    })

    await waitFor(() => {
      // Check memory display
      expect(screen.getByText(/256 MB/)).toBeInTheDocument()
      // Check CPU display
      expect(screen.getByText(/123.5s/)).toBeInTheDocument()
      // Check working set
      expect(screen.getByText(/200 MB/)).toBeInTheDocument()
    })
  })

  test('displays placeholder when metrics are not available', async () => {
    const mockService = {
      service: {
        ID: 'service-1',
        Spec: { Name: 'test-service' },
      },
      tasks: [
        {
          ID: 'task-1',
          Spec: { Name: 'test-service.1' },
          NodeID: 'node-1',
          NodeName: 'test-node',
          Status: { State: 'running' },
          CreatedAt: '2024-01-01T00:00:00Z',
          UpdatedAt: '2024-01-01T01:00:00Z',
        },
      ],
    }

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'currentVariantAtom':
          return 'light'
        case 'currentVariantClassesAtom':
          return 'card-class'
        case 'serviceDetailAtom':
          return mockService
        case 'baseUrlAtom':
          return 'http://localhost/'
        case 'viewAtom':
          return { timestamp: Date.now() }
        default:
          return ''
      }
    })

    global.fetch.mockResolvedValue({
      json: async () => ({ available: false }),
    })

    await act(async () => {
      render(<DetailsServiceComponent />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('node-name')).toBeInTheDocument()
    })

    // Should show placeholders for metrics
    const placeholders = screen.getAllByText('-')
    expect(placeholders.length).toBeGreaterThan(0)
  })

  test('handles fetch error gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    const mockService = {
      service: {
        ID: 'service-1',
        Spec: { Name: 'test-service' },
      },
      tasks: [],
    }

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'currentVariantAtom':
          return 'light'
        case 'currentVariantClassesAtom':
          return 'card-class'
        case 'serviceDetailAtom':
          return mockService
        case 'baseUrlAtom':
          return 'http://localhost/'
        case 'viewAtom':
          return { timestamp: Date.now() }
        default:
          return ''
      }
    })

    global.fetch.mockRejectedValue(new Error('Network error'))

    await act(async () => {
      render(<DetailsServiceComponent />)
    })

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch task metrics:',
        expect.any(Error),
      )
    })

    consoleErrorSpy.mockRestore()
  })

  test('displays high memory usage with warning color', async () => {
    const mockService = {
      service: {
        ID: 'service-1',
        Spec: { Name: 'test-service' },
      },
      tasks: [
        {
          ID: 'task-1',
          Spec: { Name: 'test-service.1' },
          NodeID: 'node-1',
          Status: { State: 'running' },
          CreatedAt: '2024-01-01T00:00:00Z',
          UpdatedAt: '2024-01-01T01:00:00Z',
        },
      ],
    }

    const mockMetrics = {
      available: true,
      metrics: {
        containers: [
          {
            taskName: 'test-service.1',
            containerId: '/docker/abc123',
            usage: 480 * 1024 * 1024,
            limit: 512 * 1024 * 1024,
            usagePercent: 93.75,
            cpuUsage: 100,
          },
        ],
      },
    }

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'currentVariantAtom':
          return 'light'
        case 'currentVariantClassesAtom':
          return 'card-class'
        case 'serviceDetailAtom':
          return mockService
        case 'baseUrlAtom':
          return 'http://localhost/'
        case 'viewAtom':
          return { timestamp: Date.now() }
        default:
          return ''
      }
    })

    global.fetch.mockResolvedValue({
      json: async () => mockMetrics,
    })

    await act(async () => {
      render(<DetailsServiceComponent />)
    })

    await waitFor(() => {
      const percentCell = screen.getByText(/93.75/)
      expect(percentCell.closest('td')).toHaveClass('text-danger')
    })
  })

  test('renders all four tabs', () => {
    const mockService = {
      service: {
        ID: 'service-1',
        Spec: { Name: 'test-service' },
      },
      tasks: [],
    }

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'currentVariantAtom':
          return 'light'
        case 'currentVariantClassesAtom':
          return 'card-class'
        case 'serviceDetailAtom':
          return mockService
        case 'baseUrlAtom':
          return 'http://localhost/'
        case 'viewAtom':
          return { timestamp: Date.now() }
        default:
          return ''
      }
    })

    global.fetch.mockResolvedValue({
      json: async () => ({ available: false }),
    })

    render(<DetailsServiceComponent />)

    expect(screen.getByText('Metrics')).toBeInTheDocument()
    expect(screen.getByText('Tasks')).toBeInTheDocument()
    expect(screen.getByText('Table')).toBeInTheDocument()
    expect(screen.getByText('JSON')).toBeInTheDocument()
  })

  test('displays container ID in short format', async () => {
    const mockService = {
      service: {
        ID: 'service-1',
        Spec: { Name: 'test-service' },
      },
      tasks: [
        {
          ID: 'task-1',
          Spec: { Name: 'test-service.1' },
          NodeID: 'node-1',
          Status: { State: 'running' },
          CreatedAt: '2024-01-01T00:00:00Z',
          UpdatedAt: '2024-01-01T01:00:00Z',
        },
      ],
    }

    const mockMetrics = {
      available: true,
      metrics: {
        containers: [
          {
            taskName: 'test-service.1',
            containerId: '/docker/abc123def456ghi789jkl',
            usage: 256 * 1024 * 1024,
            limit: 512 * 1024 * 1024,
            usagePercent: 50,
            cpuUsage: 100,
          },
        ],
      },
    }

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'currentVariantAtom':
          return 'light'
        case 'currentVariantClassesAtom':
          return 'card-class'
        case 'serviceDetailAtom':
          return mockService
        case 'baseUrlAtom':
          return 'http://localhost/'
        case 'viewAtom':
          return { timestamp: Date.now() }
        default:
          return ''
      }
    })

    global.fetch.mockResolvedValue({
      json: async () => mockMetrics,
    })

    await act(async () => {
      render(<DetailsServiceComponent />)
    })

    await waitFor(() => {
      // Container ID should be truncated to 12 chars
      expect(screen.getByText('abc123def456')).toBeInTheDocument()
    })
  })
})
