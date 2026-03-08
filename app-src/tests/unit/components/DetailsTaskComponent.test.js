// Unit tests for DetailsTaskComponent
import { render, screen, waitFor, act } from '@testing-library/react'
const ReactApexChartMock = require('../../../__mocks__/react-apexcharts')

// Mock atoms
jest.mock('../../../src/common/store/atoms', () => ({
  currentVariantAtom: 'currentVariantAtom',
  currentVariantClassesAtom: 'currentVariantClassesAtom',
  taskDetailAtom: 'taskDetailAtom',
  baseUrlAtom: 'baseUrlAtom',
  isDarkModeAtom: 'isDarkModeAtom',
  viewAtom: 'viewAtom',
  serviceNameFilterAtom: 'serviceNameFilterAtom',
  stackNameFilterAtom: 'stackNameFilterAtom',
  filterTypeAtom: 'filterTypeAtom',
  showNamesButtonsAtom: 'showNamesButtonsAtom',
}))

// Mock components used inside DetailsTaskComponent
jest.mock('../../../src/components/shared/JsonTable', () => ({
  JsonTable: () => <div data-testid="json-table">JsonTable Mock</div>,
}))

jest.mock('../../../src/components/shared/names/EntityName', () => ({
  EntityName: ({ name, id, entityType }) => (
    <span data-testid={entityType === 'node' ? 'node-name' : 'service-name'}>{name || id}</span>
  ),
}))

jest.mock('../../../src/components/services/ServiceStatusBadge', () => ({
  __esModule: true,
  default: ({ serviceState }) => <span data-testid="status-badge">{serviceState}</span>,
}))

jest.mock('../../../src/common/DefaultDateTimeFormat', () => ({
  toDefaultDateTimeString: (d) => d || 'N/A',
}))

// Global fetch mock
global.fetch = jest.fn()

const mockUseAtomValue = jest.fn()
const mockUseAtom = jest.fn()
jest.mock('jotai', () => ({
  useAtomValue: (...args) => mockUseAtomValue(...args),
  useAtom: (...args) => mockUseAtom(...args),
}))

const mod = require('../../../src/components/tasks/DetailsTaskComponent')
const DetailsTaskComponent =
  mod.DetailsTaskComponent || mod.default || mod

// Helpers
const baseAtomValues = (task, isDarkMode = false) => (atom) => {
  switch (atom) {
    case 'taskDetailAtom': return task
    case 'currentVariantAtom': return 'light'
    case 'currentVariantClassesAtom': return 'card-class'
    case 'baseUrlAtom': return 'http://localhost/'
    case 'isDarkModeAtom': return isDarkMode
    case 'viewAtom': return { timestamp: 0 }
    default: return ''
  }
}

const mkTask = (id = 'task-1') => ({
  ID: id,
  Spec: { Name: `service.1` },
  ServiceID: 'svc-1',
  ServiceName: 'my-service',
  NodeID: 'node-1',
  NodeName: 'my-node',
  Status: {
    State: 'running',
    ContainerStatus: { ContainerID: 'abc123' },
    Err: '',
  },
  CreatedAt: '2024-01-01T00:00:00Z',
  UpdatedAt: '2024-01-01T01:00:00Z',
  Slot: 1,
  DesiredState: 'running',
})

const mkMetrics = (overrides = {}) => ({
  available: true,
  metrics: {
    usage: 268435456,
    workingSet: 201326592,
    memoryCache: 20971520,
    limit: 536870912,
    usagePercent: 50.0,
    cpuUsage: 123.45,
    cpuUserSeconds: 88.12,
    cpuSystemSeconds: 35.33,
    cpuPercent: 45.0,
    networkRxBytes: 123456789,
    networkTxBytes: 98765432,
    fsUsage: 524288000,
    fsLimit: 10737418240,
    containerId: 'docker://abc123',
    serverTime: Date.now() / 1000,
    ...overrides,
  },
})

describe('DetailsTaskComponent', () => {
  beforeEach(() => {
    mockUseAtomValue.mockReset()
    mockUseAtom.mockReset()
    mockUseAtom.mockReturnValue([null, jest.fn()])
    global.fetch.mockReset()
    jest.clearAllMocks()
    ReactApexChartMock.clearCaptured()
  })

  test('renders "Task doesn\'t exist" when task is null', () => {
    mockUseAtomValue.mockImplementation(baseAtomValues(null))
    render(<DetailsTaskComponent />)
    expect(screen.getByText("Task doesn't exist")).toBeInTheDocument()
  })

  test('renders task info table when task is set', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues(mkTask()))
    global.fetch.mockResolvedValue({ json: async () => mkMetrics() })

    await act(async () => render(<DetailsTaskComponent />))
    expect(screen.getByText(/Task Information/i)).toBeInTheDocument()
  })

  test('ServiceName and NodeName receive correct name+id props and render names', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues(mkTask()))
    global.fetch.mockResolvedValue({ json: async () => mkMetrics() })

    await act(async () => render(<DetailsTaskComponent />))
    // ServiceName mock renders `name || id`; name='my-service'
    expect(screen.getByTestId('service-name')).toHaveTextContent('my-service')
    // NodeName mock renders `name || id`; name='my-node'
    expect(screen.getByTestId('node-name')).toHaveTextContent('my-node')
  })

  test('ServiceStatusBadge receives serviceState prop and renders state text', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues(mkTask()))
    global.fetch.mockResolvedValue({ json: async () => mkMetrics() })

    await act(async () => render(<DetailsTaskComponent />))
    // Both the card header badge and the table badge should show 'running'
    const badges = screen.getAllByTestId('status-badge')
    expect(badges.length).toBeGreaterThanOrEqual(1)
    badges.forEach((badge) => expect(badge).toHaveTextContent('running'))
  })

  test('shows loading text while metrics are loading', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues(mkTask()))
    // Never resolves, so loading stays true
    global.fetch.mockImplementation(() => new Promise(() => {}))

    await act(async () => render(<DetailsTaskComponent />))
    // The loading indicator text is rendered inside the metrics tab
    await waitFor(() => {
      expect(screen.getByText(/Loading metrics/i)).toBeInTheDocument()
    })
  })

  test('renders memory and CPU charts when metrics are available', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues(mkTask()))
    global.fetch.mockResolvedValue({ json: async () => mkMetrics() })

    await act(async () => render(<DetailsTaskComponent />))
    await waitFor(() => {
      // Memory gauge (radialBar) and CPU gauge should be rendered via the mock
      const charts = screen.getAllByTestId(/^apex-chart-/)
      expect(charts.length).toBeGreaterThan(0)
    })
  })

  test('renders memory charts: memory radialBar gauge present', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues(mkTask()))
    global.fetch.mockResolvedValue({ json: async () => mkMetrics() })

    await act(async () => render(<DetailsTaskComponent />))
    await waitFor(() => {
      expect(screen.getAllByTestId('apex-chart-radialBar').length).toBeGreaterThanOrEqual(1)
    })
  })

  test('renders donut chart for memory breakdown', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues(mkTask()))
    global.fetch.mockResolvedValue({ json: async () => mkMetrics() })

    await act(async () => render(<DetailsTaskComponent />))
    await waitFor(() => {
      expect(screen.getAllByTestId('apex-chart-donut').length).toBeGreaterThanOrEqual(1)
    })
  })

  test('renders network bar chart when networkRxBytes > 0', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues(mkTask()))
    global.fetch.mockResolvedValue({ json: async () => mkMetrics() })

    await act(async () => render(<DetailsTaskComponent />))
    await waitFor(() => {
      expect(screen.queryByText(/Network/i)).toBeInTheDocument()
    })
  })

  test('hides network chart when no network data', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues(mkTask()))
    global.fetch.mockResolvedValue({
      json: async () => mkMetrics({ networkRxBytes: 0, networkTxBytes: 0 }),
    })

    await act(async () => render(<DetailsTaskComponent />))
    await waitFor(() => {
      // "Network" section title should not be present if both are 0
      const charts = screen.queryAllByTestId('apex-chart-bar')
      const networkSection = charts.find(
        (el) => el.getAttribute('aria-label') === 'Network I/O',
      )
      expect(networkSection).toBeUndefined()
    })
  })

  test('shows "metrics not available" alert when available is false', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues(mkTask()))
    global.fetch.mockResolvedValue({
      json: async () => ({ available: false }),
    })

    await act(async () => render(<DetailsTaskComponent />))
    await waitFor(() => {
      expect(screen.getByText(/not available/i)).toBeInTheDocument()
    })
  })

  test('shows fetch error alert on network failure', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues(mkTask()))
    global.fetch.mockRejectedValue(new Error('network down'))

    await act(async () => render(<DetailsTaskComponent />))
    await waitFor(() => {
      expect(screen.getByText(/failed to fetch metrics/i)).toBeInTheDocument()
    })
  })

  test('renders dark mode charts without crashing', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues(mkTask(), true))
    global.fetch.mockResolvedValue({ json: async () => mkMetrics() })

    await act(async () => render(<DetailsTaskComponent />))
    await waitFor(() => {
      const charts = screen.getAllByTestId(/^apex-chart-/)
      expect(charts.length).toBeGreaterThan(0)
    })
  })

  test('renders FS stacked bar when fsUsage > 0', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues(mkTask()))
    global.fetch.mockResolvedValue({
      json: async () => mkMetrics({ fsUsage: 524288000, fsLimit: 10737418240 }),
    })

    await act(async () => render(<DetailsTaskComponent />))
    await waitFor(() => {
      // FS chart is a bar type — check it exists via data-testid
      const barCharts = screen.queryAllByTestId('apex-chart-bar')
      expect(barCharts.length).toBeGreaterThanOrEqual(1)
    })
  })

  test('renders CPU pie chart when user/system seconds are available', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues(mkTask()))
    global.fetch.mockResolvedValue({
      json: async () => mkMetrics({ cpuUserSeconds: 88.12, cpuSystemSeconds: 35.33 }),
    })

    await act(async () => render(<DetailsTaskComponent />))
    await waitFor(() => {
      const piecharts = screen.queryAllByTestId('apex-chart-pie')
      expect(piecharts.length).toBeGreaterThanOrEqual(1)
    })
  })

  test('shows error message when metrics return a message field', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues(mkTask()))
    global.fetch.mockResolvedValue({
      json: async () => ({ available: false, message: 'cAdvisor not reachable' }),
    })

    await act(async () => render(<DetailsTaskComponent />))
    await waitFor(() => {
      expect(screen.getByText(/cAdvisor not reachable/i)).toBeInTheDocument()
    })
  })

  test('handles usagePercent > 90 (red memory gauge color branch)', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues(mkTask()))
    global.fetch.mockResolvedValue({
      json: async () => mkMetrics({ usagePercent: 95, cpuPercent: 95 }),
    })

    await act(async () => render(<DetailsTaskComponent />))
    await waitFor(() => {
      const gauges = screen.queryAllByTestId('apex-chart-radialBar')
      expect(gauges.length).toBeGreaterThanOrEqual(1)
    })
  })

  test('handles usagePercent > 75 (orange memory gauge color branch)', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues(mkTask()))
    global.fetch.mockResolvedValue({
      json: async () => mkMetrics({ usagePercent: 80, cpuPercent: 80 }),
    })

    await act(async () => render(<DetailsTaskComponent />))
    await waitFor(() => {
      const gauges = screen.queryAllByTestId('apex-chart-radialBar')
      expect(gauges.length).toBeGreaterThanOrEqual(1)
    })
  })

  test('renders memory donut without limit (no Available segment)', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues(mkTask()))
    global.fetch.mockResolvedValue({
      json: async () => mkMetrics({ limit: 0, usagePercent: 0 }),
    })

    await act(async () => render(<DetailsTaskComponent />))
    await waitFor(() => {
      const donuts = screen.queryAllByTestId('apex-chart-donut')
      expect(donuts.length).toBeGreaterThanOrEqual(1)
    })
  })

  test('renders FS chart without limit (no Available bar)', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues(mkTask()))
    global.fetch.mockResolvedValue({
      json: async () => mkMetrics({ fsUsage: 100000, fsLimit: 0 }),
    })

    await act(async () => render(<DetailsTaskComponent />))
    await waitFor(() => {
      const bars = screen.queryAllByTestId('apex-chart-bar')
      expect(bars.length).toBeGreaterThanOrEqual(1)
    })
  })

  test('chart formatters are callable from captured options', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues(mkTask()))
    global.fetch.mockResolvedValue({ json: async () => mkMetrics() })

    await act(async () => render(<DetailsTaskComponent />))
    await waitFor(() => {
      const charts = screen.getAllByTestId(/^apex-chart-/)
      expect(charts.length).toBeGreaterThan(0)
    })

    // Exercise captured ApexChart formatter closures for coverage
    const captured = ReactApexChartMock.getCaptured()
    for (const [, chart] of Object.entries(captured)) {
      const opts = chart.options
      // value formatter in radialBar
      const valFormatter = opts?.plotOptions?.radialBar?.dataLabels?.value?.formatter
      if (valFormatter) expect(typeof valFormatter(50)).toBe('string')
      // total formatter in donut
      const totalFormatter = opts?.plotOptions?.pie?.donut?.labels?.total?.formatter
      if (totalFormatter) expect(typeof totalFormatter()).toBe('string')
      // dataLabels formatter
      const dlFormatter = opts?.dataLabels?.formatter
      if (dlFormatter) expect(typeof dlFormatter(50)).toBe('string')
      // xaxis label formatter
      const xFormatter = opts?.xaxis?.labels?.formatter
      if (xFormatter) expect(typeof xFormatter(1024)).toBe('string')
      // tooltip y formatter
      const tooltipY = opts?.tooltip?.y?.formatter
      if (tooltipY) expect(typeof tooltipY(50, { seriesIndex: 0 })).toBe('string')
    }
  })

  test('renders with zero usage and cpuPercent=0 (covers || 0 and conditional branches)', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues(mkTask()))
    global.fetch.mockResolvedValue({
      json: async () =>
        mkMetrics({
          usage: 0,
          usagePercent: 0,
          limit: 0,
          cpuUsage: 0,
          cpuPercent: 0,
          cpuUserSeconds: 0,
          cpuSystemSeconds: 0,
          networkRxBytes: 1024,
          networkTxBytes: 2048,
          fsUsage: 0,
        }),
    })

    await act(async () => render(<DetailsTaskComponent />))
    await waitFor(() => {
      // With limit=0 and usagePercent=0, memory gauge is hidden; only donut shown
      const charts = screen.getAllByTestId(/^apex-chart-/)
      expect(charts.length).toBeGreaterThanOrEqual(1)
    })
  })

  test('renders with network rx/tx zero values in row (covers || 0 in networkRxBytes)', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues(mkTask()))
    global.fetch.mockResolvedValue({
      json: async () =>
        mkMetrics({
          networkRxBytes: undefined,
          networkTxBytes: undefined,
        }),
    })

    await act(async () => render(<DetailsTaskComponent />))
    await waitFor(() => {
      const charts = screen.getAllByTestId(/^apex-chart-/)
      expect(charts.length).toBeGreaterThanOrEqual(1)
    })
  })
})
