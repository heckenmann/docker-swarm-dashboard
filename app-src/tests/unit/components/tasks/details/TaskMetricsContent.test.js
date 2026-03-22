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
      const { container } = render(
        <TaskMetricsContent
          taskMetrics={taskMetrics}
          metricsLoading={false}
          metricsError={null}
        />
      )

      const charts = container.querySelectorAll('[data-testid="mock-chart"]')
      const memoryCharts = Array.from(charts).filter(chart => {
        const options = JSON.parse(chart.getAttribute('data-options'))
        return options.title.text.includes('Memory')
      })
      expect(memoryCharts).toHaveLength(2) // memory(2)
    })

    test('renders CPU charts', () => {
      const { container } = render(
        <TaskMetricsContent
          taskMetrics={taskMetrics}
          metricsLoading={false}
          metricsError={null}
        />
      )

      const charts = container.querySelectorAll('[data-testid="mock-chart"]')
      const cpuCharts = Array.from(charts).filter(chart => {
        const options = JSON.parse(chart.getAttribute('data-options'))
        return options.title.text.includes('CPU')
      })
      expect(cpuCharts).toHaveLength(2) // cpu(2)
    })

    test('renders network chart', () => {
      const { container } = render(
        <TaskMetricsContent
          taskMetrics={taskMetrics}
          metricsLoading={false}
          metricsError={null}
        />
      )

      const charts = container.querySelectorAll('[data-testid="mock-chart"]')
      const networkCharts = Array.from(charts).filter(chart => {
        const options = JSON.parse(chart.getAttribute('data-options'))
        return options.title.text.includes('Network')
      })
      expect(networkCharts).toHaveLength(1) // network(1)
    })

    test('renders filesystem chart', () => {
      const { container } = render(
        <TaskMetricsContent
          taskMetrics={taskMetrics}
          metricsLoading={false}
          metricsError={null}
        />
      )

      const charts = container.querySelectorAll('[data-testid="mock-chart"]')
      const fsCharts = Array.from(charts).filter(chart => {
        const options = JSON.parse(chart.getAttribute('data-options'))
        return options.title.text.includes('Filesystem')
      })
      expect(fsCharts).toHaveLength(1) // fs(1)
    })

    test('hides network chart when no network data', () => {
      const metricsWithoutNetwork = {
        ...taskMetrics,
        networkRxBytes: 0,
        networkTxBytes: 0,
      }

      const { container } = render(
        <TaskMetricsContent
          taskMetrics={metricsWithoutNetwork}
          metricsLoading={false}
          metricsError={null}
        />
      )

      const charts = container.querySelectorAll('[data-testid="mock-chart"]')
      const networkCharts = Array.from(charts).filter(chart => {
        const options = JSON.parse(chart.getAttribute('data-options'))
        return options.title.text.includes('Network')
      })
      expect(networkCharts).toHaveLength(0) // no network
    })

    test('hides filesystem chart when no fs data', () => {
      const metricsWithoutFS = {
        ...taskMetrics,
        fsUsage: 0,
      }

      const { container } = render(
        <TaskMetricsContent
          taskMetrics={metricsWithoutFS}
          metricsLoading={false}
          metricsError={null}
        />
      )

      const charts = container.querySelectorAll('[data-testid="mock-chart"]')
      const fsCharts = Array.from(charts).filter(chart => {
        const options = JSON.parse(chart.getAttribute('data-options'))
        return options.title.text.includes('Filesystem')
      })
      expect(fsCharts).toHaveLength(0) // no fs
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

      const { container } = render(
        <TaskMetricsContent
          taskMetrics={metricsWithoutCPU}
          metricsLoading={false}
          metricsError={null}
        />
      )

      // CPU breakdown should not be present
      expect(container.querySelector('[data-testid="mock-chart"]')).not.toContainHTML('CPU Time Split')
    })
  })
})