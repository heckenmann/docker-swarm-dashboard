// TaskMetricsContent.test.js
// Tests for the TaskMetricsContent component

const { render, screen, cleanup } = require('@testing-library/react')
const { TaskMetricsContent } = require('../../../../../src/components/tasks/details')

// Mock external dependencies
jest.mock('jotai', () => ({
  useAtomValue: jest.fn(() => false), // Default: isDarkMode = false
  atom: jest.fn(),
}))

jest.mock('../../../../../src/common/utils/chartUtils', () => ({
  getCommonChartOptions: jest.fn(),
  METRIC_THRESHOLDS: {
    warning: 75,
    critical: 90,
  },
  CHART_PALETTES: {
    cpu: ['#0d6efd', '#6f42c1', '#20c997', '#6610f2'],
    memory: ['#28a745', '#20c997', '#17a2b8', '#198754'],
    network: ['#6f42c1', '#8530d0', '#9b59b6', '#a355c7'],
    filesystem: ['#fd7e14', '#d9740a', '#c76a09', '#b36108'],
    status: {
      normal: '#28a745',
      warning: '#fd7e14',
      critical: '#dc3545',
    },
  },
  GAUGE_DEFAULTS: {
    startAngle: -130,
    endAngle: 130,
    hollowSize: '55%',
    trackBackgroundLight: '#e0e0e0',
    trackBackgroundDark: '#444',
    valueFontSize: '22px',
    nameFontSize: '14px',
  },
  getGaugeTrackBackground: jest.fn(() => '#e0e0e0'),
  getStatusColor: jest.fn((percentage) => {
    if (percentage > 90) return '#dc3545'
    if (percentage > 75) return '#fd7e14'
    return '#28a745'
  }),
}))

jest.mock('../../../../../src/common/formatUtils', () => ({
  formatBytesCompact: jest.fn((bytes) => `${bytes} B`),
  pctClass: jest.fn((val) => `pct-${val > 75 ? 'danger' : 'normal'}`),
}))

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="mock-icon">Icon</span>,
}))

jest.mock('react-bootstrap', () => ({
  Alert: ({ variant, children }) => (
    <div data-testid={`mock-alert-${variant}`}>{children}</div>
  ),
  Row: ({ children }) => <div data-testid="mock-row">{children}</div>,
  Col: ({ children }) => <div data-testid="mock-col">{children}</div>,
  Spinner: ({ animation, size, className }) => (
    <span data-testid="mock-spinner" className={className}>
      {animation}-{size}
    </span>
  ),
  Card: ({ children, className }) => (
    <div data-testid="mock-card" className={className}>{children}</div>
  ),
  CardHeader: ({ children }) => <div data-testid="mock-card-header">{children}</div>,
  CardBody: ({ children }) => <div data-testid="mock-card-body">{children}</div>,
  Badge: ({ children, className }) => <span data-testid="mock-badge" className={className}>{children}</span>,
}))

jest.mock('../../../../../src/components/shared/MetricCard', () => ({
  __esModule: true,
  default: ({ title, icon, children, chartContent }) => (
    <div data-testid="mock-metric-card" data-title={title} data-icon={icon} data-chart-content={chartContent}>
      {children}
    </div>
  ),
}))

jest.mock('../../../../../src/components/shared/MetricGrid', () => ({
  __esModule: true,
  default: ({ children }) => (
    <div data-testid="mock-metric-grid">{children}</div>
  ),
}))

// Mock ReactApexChart
jest.mock('react-apexcharts', () => ({
  __esModule: true,
  default: ({ options, series, type, height }) => (
    <div
      data-testid="mock-chart"
      data-options={JSON.stringify(options)}
      data-series={JSON.stringify(series)}
      data-type={type}
      data-height={height}
    />
  ),
}))

describe('TaskMetricsContent', () => {
  const mockUseAtomValue = require('jotai').useAtomValue
  const mockGetCommonChartOptions = require('../../../../../src/common/chartUtils').getCommonChartOptions

  beforeEach(() => {
    mockUseAtomValue.mockReturnValue(false) // isDarkMode = false
    mockGetCommonChartOptions.mockReturnValue({
      chart: {},
      theme: { mode: 'light' },
      xaxis: {},
    })
  })

  afterEach(() => {
    cleanup()
  })

  describe('loading state', () => {
    test('renders loading spinner when metricsLoading is true', () => {
      render(
        <TaskMetricsContent
          taskMetrics={null}
          metricsLoading={true}
          metricsError={null}
        />
      )

      expect(screen.getByTestId('mock-spinner')).toBeInTheDocument()
      expect(screen.getByText('Loading metrics...')).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    test('renders error alert when metricsError is set', () => {
      render(
        <TaskMetricsContent
          taskMetrics={null}
          metricsLoading={false}
          metricsError="Failed to fetch metrics"
        />
      )

      expect(screen.getByTestId('mock-alert-info')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch metrics')).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    test('renders info alert when taskMetrics is null', () => {
      render(
        <TaskMetricsContent
          taskMetrics={null}
          metricsLoading={false}
          metricsError={null}
        />
      )

      expect(screen.getByTestId('mock-alert-info')).toBeInTheDocument()
      expect(screen.getByText('Metrics not available for this task')).toBeInTheDocument()
    })
  })

  describe('success state', () => {
    const taskMetrics = {
      containerId: '/tasks/my-task-id',
      usage: 500,
      limit: 1000,
      usagePercent: 50,
      cpuUsage: 1.5,
      cpuPercent: 25,
      cpuUserSeconds: 1,
      cpuSystemSeconds: 0.5,
      networkRxBytes: 1000,
      networkTxBytes: 2000,
      fsUsage: 50,
      fsLimit: 100,
    }

    test('renders summary row with all metrics', () => {
      render(
        <TaskMetricsContent
          taskMetrics={taskMetrics}
          metricsLoading={false}
          metricsError={null}
        />
      )

      expect(screen.getByText('Container:')).toBeInTheDocument()
      expect(screen.getByText('my-task-id')).toBeInTheDocument()
      expect(screen.getByText('500 B / 1000 B')).toBeInTheDocument()
      expect(screen.getByText('1.50s')).toBeInTheDocument()
      expect(screen.getByText('↓ 1000 B / ↑ 2000 B')).toBeInTheDocument()
    })

    test('renders memory charts', () => {
      render(
        <TaskMetricsContent
          taskMetrics={taskMetrics}
          metricsLoading={false}
          metricsError={null}
        />
      )

      const cards = screen.getAllByTestId('mock-metric-card')
      const memoryCard = cards.find((c) => c.getAttribute('data-title') === 'Memory Usage')
      expect(memoryCard).toBeDefined()
      const charts = memoryCard.querySelectorAll('[data-testid="mock-chart"]')
      expect(charts).toHaveLength(2)
    })

    test('renders CPU charts', () => {
      render(
        <TaskMetricsContent
          taskMetrics={taskMetrics}
          metricsLoading={false}
          metricsError={null}
        />
      )

      const cards = screen.getAllByTestId('mock-metric-card')
      const cpuCard = cards.find((c) => c.getAttribute('data-title') === 'CPU Usage')
      expect(cpuCard).toBeDefined()
      const charts = cpuCard.querySelectorAll('[data-testid="mock-chart"]')
      expect(charts).toHaveLength(2)
    })

    test('renders network chart', () => {
      render(
        <TaskMetricsContent
          taskMetrics={taskMetrics}
          metricsLoading={false}
          metricsError={null}
        />
      )

      const cards = screen.getAllByTestId('mock-metric-card')
      const networkCard = cards.find((c) => c.getAttribute('data-title') === 'Network Traffic')
      expect(networkCard).toBeDefined()
      const chart = networkCard.querySelector('[data-testid="mock-chart"]')
      expect(chart).not.toBeNull()
    })

    test('renders filesystem chart', () => {
      render(
        <TaskMetricsContent
          taskMetrics={taskMetrics}
          metricsLoading={false}
          metricsError={null}
        />
      )

      const cards = screen.getAllByTestId('mock-metric-card')
      const fsCard = cards.find((c) => c.getAttribute('data-title') === 'Filesystem Usage')
      expect(fsCard).toBeDefined()
      const chart = fsCard.querySelector('[data-testid="mock-chart"]')
      expect(chart).not.toBeNull()
    })

    test('hides network chart when no network data', () => {
      const metricsWithoutNetwork = {
        ...taskMetrics,
        networkRxBytes: 0,
        networkTxBytes: 0,
      }

      render(
        <TaskMetricsContent
          taskMetrics={metricsWithoutNetwork}
          metricsLoading={false}
          metricsError={null}
        />
      )

      const cards = screen.queryAllByTestId('mock-metric-card')
      const networkCard = cards.find((c) => c.getAttribute('data-title') === 'Network Traffic')
      expect(networkCard).toBeUndefined()
    })

    test('hides filesystem chart when no fs data', () => {
      const metricsWithoutFS = {
        ...taskMetrics,
        fsUsage: 0,
      }

      render(
        <TaskMetricsContent
          taskMetrics={metricsWithoutFS}
          metricsLoading={false}
          metricsError={null}
        />
      )

      const cards = screen.queryAllByTestId('mock-metric-card')
      const fsCard = cards.find((c) => c.getAttribute('data-title') === 'Filesystem Usage')
      expect(fsCard).toBeUndefined()
    })

    test('shows CPU info alert when no quota configured', () => {
      const metricsWithoutCPU = {
        ...taskMetrics,
        cpuPercent: 0,
        cpuUserSeconds: 0,
        cpuSystemSeconds: 0,
      }

      render(
        <TaskMetricsContent
          taskMetrics={metricsWithoutCPU}
          metricsLoading={false}
          metricsError={null}
        />
      )

      expect(screen.getByText('CPU details not available (no quota configured)')).toBeInTheDocument()
    })

    test('renders with dark mode', () => {
      const mockUseAtomValue = require('jotai').useAtomValue
      const mockGetCommonChartOptions = require('../../../../../src/common/chartUtils').getCommonChartOptions

      mockUseAtomValue.mockReturnValue(true) // isDarkMode = true
      mockGetCommonChartOptions.mockReturnValue({
        chart: {},
        theme: { mode: 'dark' },
        xaxis: {},
      })

      render(
        <TaskMetricsContent
          taskMetrics={taskMetrics}
          metricsLoading={false}
          metricsError={null}
        />
      )

      expect(screen.getByText('Container:')).toBeInTheDocument()
    })

    test('hides CPU breakdown when no CPU data', () => {
      const metricsWithoutCPU = {
        ...taskMetrics,
        cpuUserSeconds: 0,
        cpuSystemSeconds: 0,
      }

      render(
        <TaskMetricsContent
          taskMetrics={metricsWithoutCPU}
          metricsLoading={false}
          metricsError={null}
        />
      )

      const cards = screen.getAllByTestId('mock-metric-card')
      const cpuCard = cards.find((c) => c.getAttribute('data-title') === 'CPU Usage')
      expect(cpuCard).toBeDefined()
      // Should only have 1 chart (gauge) instead of 2 (gauge + breakdown)
      const charts = cpuCard.querySelectorAll('[data-testid="mock-chart"]')
      expect(charts).toHaveLength(1)
    })
  })
})