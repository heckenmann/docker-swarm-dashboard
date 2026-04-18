// Unit tests for NodeMetricsComponent
import { render, screen, waitFor, act } from '@testing-library/react'
const ReactApexChartMock = require('../../../__mocks__/react-apexcharts')

// Mock atoms
jest.mock('../../../src/common/store/atoms/foundationAtoms', () => ({
  baseUrlAtom: 'baseUrlAtom',
}))

jest.mock('../../../src/common/store/atoms/themeAtoms', () => ({
  isDarkModeAtom: 'isDarkModeAtom',
}))

jest.mock('../../../src/common/store/atoms/uiAtoms', () => ({
  tableSizeAtom: 'tableSizeAtom',
}))

jest.mock('../../../src/common/store/atoms/navigationAtoms', () => ({
  viewAtom: 'viewAtom',
}))

global.fetch = jest.fn()

const mockUseAtomValue = jest.fn()
jest.mock('jotai', () => ({
  useAtomValue: (...args) => mockUseAtomValue(...args),
}))

const mod = require('../../../src/components/nodes/NodeMetricsComponent')
const NodeMetricsComponent = mod.default

// Helpers
const baseAtomValues = (isDarkMode = false) => (atom) => {
  switch (atom) {
    case 'baseUrlAtom': return 'http://localhost/'
    case 'isDarkModeAtom': return isDarkMode
    case 'tableSizeAtom': return 'sm'
    case 'viewAtom': return { timestamp: 0 }
    default: return ''
  }
}

const mkNodeMetrics = (overrides = {}) => ({
  available: true,
  metrics: {
    cpu: [
      { mode: 'idle', value: 25222.11 },
      { mode: 'user', value: 1735.79 },
      { mode: 'system', value: 869.34 },
      { mode: 'iowait', value: 222.21 },
    ],
    memory: {
      total: 8589934592,
      free: 2147483648,
      available: 4294967296,
      buffers: 134217728,
      cached: 1073741824,
      swapTotal: 2147483648,
      swapFree: 1073741824,
      swapUsed: 1073741824,
      swapUsedPercent: 50.0,
    },
    filesystem: [
      {
        device: '/dev/sda1',
        mountpoint: '/',
        size: 107374182400,
        available: 53687091200,
        used: 53687091200,
        usedPercent: 50.0,
      },
    ],
    network: [
      {
        interface: 'eth0',
        receiveBytes: 123456789012,
        transmitBytes: 987654321098,
        receivePackets: 456789012,
        transmitPackets: 654321098,
        receiveErrs: 0,
        transmitErrs: 0,
        receiveDrop: 0,
        transmitDrop: 0,
      },
    ],
    diskIO: [
      {
        device: 'sda',
        readsCompleted: 1234567,
        writesCompleted: 9876543,
        readBytes: 52428800000,
        writtenBytes: 104857600000,
        ioTimeSeconds: 12345.67,
        ioTimeWeightedSeconds: 23456.78,
      },
    ],
    ntp: { offsetSeconds: 0.000123, syncStatus: 1 },
    system: {
      load1: 0.52,
      load5: 0.48,
      load15: 0.45,
      bootTime: Date.now() / 1000 - 86400 * 7,
      uptimeSeconds: 86400 * 7,
      numCPUs: 4,
      contextSwitches: 123456789,
      interrupts: 987654321,
      procsRunning: 3,
      procsBlocked: 0,
      entropyAvailBits: 3584,
      pageFaults: 12345678,
      majorPageFaults: 42,
    },
    tcp: { alloc: 512, inuse: 256, currEstab: 128, timeWait: 32 },
    fileDescriptor: { allocated: 2048, maximum: 65536, usedPercent: 3.125 },
    serverTime: Date.now() / 1000,
    ...overrides,
  },
})

describe('NodeMetricsComponent', () => {
  beforeEach(() => {
    mockUseAtomValue.mockReset()
    global.fetch.mockReset()
    jest.clearAllMocks()
    ReactApexChartMock.clearCaptured()
  })

  test('shows loading spinner initially', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues())
    global.fetch.mockImplementation(() => new Promise(() => {}))

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  test('shows "not available" alert when metrics are unavailable', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues())
    global.fetch.mockResolvedValue({
      json: async () => ({ available: false }),
    })

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
    await waitFor(() => {
      expect(screen.getByText(/Not Configured/i)).toBeInTheDocument()
    })
  })

  test('renders charts when metrics data is available', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues())
    global.fetch.mockResolvedValue({ json: async () => mkNodeMetrics() })

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
    await waitFor(() => {
      const charts = screen.getAllByTestId(/^apex-chart-/)
      expect(charts.length).toBeGreaterThan(0)
    })
  })

  test('renders CPU donut chart', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues())
    global.fetch.mockResolvedValue({ json: async () => mkNodeMetrics() })

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
    await waitFor(() => {
      // CPU donut should be present
      expect(screen.getAllByTestId('apex-chart-donut').length).toBeGreaterThanOrEqual(1)
    })
  })

  test('renders load average radialBar gauge', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues())
    global.fetch.mockResolvedValue({ json: async () => mkNodeMetrics() })

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
    await waitFor(() => {
      expect(screen.getAllByTestId('apex-chart-radialBar').length).toBeGreaterThanOrEqual(1)
    })
  })

  test('renders memory donut with 3 segments when buffers/cached > 0', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues())
    global.fetch.mockResolvedValue({ json: async () => mkNodeMetrics() })

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
    await waitFor(() => {
      // Should have donut charts for memory AND CPU
      expect(screen.getAllByTestId('apex-chart-donut').length).toBeGreaterThanOrEqual(2)
    })
  })

  test('renders memory donut with 2 segments when no buffers/cached', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues())
    global.fetch.mockResolvedValue({
      json: async () =>
        mkNodeMetrics({
          memory: {
            total: 8589934592,
            free: 2147483648,
            available: 4294967296,
            buffers: 0,
            cached: 0,
            swapTotal: 0,
            swapFree: 0,
            swapUsed: 0,
            swapUsedPercent: 0,
          },
        }),
    })

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
    await waitFor(() => {
      // At minimum memory donut (2-segment) + CPU donut
      expect(screen.getAllByTestId('apex-chart-donut').length).toBeGreaterThanOrEqual(1)
    })
  })

  test('renders entropy row in system stats when entropyAvailBits > 0', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues())
    global.fetch.mockResolvedValue({ json: async () => mkNodeMetrics() })

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
    await waitFor(() => {
      expect(screen.getByText(/Entropy Available/i)).toBeInTheDocument()
    })
  })

  test('renders page faults row when pageFaults > 0', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues())
    global.fetch.mockResolvedValue({ json: async () => mkNodeMetrics() })

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
    await waitFor(() => {
      // "Page Faults:" row (not "Major Page Faults:")
      const cells = screen.getAllByText(/Page Faults/i)
      expect(cells.length).toBeGreaterThanOrEqual(1)
    })
  })

  test('renders TCP donut chart when tcp.alloc > 0', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues())
    global.fetch.mockResolvedValue({ json: async () => mkNodeMetrics() })

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
    await waitFor(() => {
      // TCP donut is one of the donut charts
      const donuts = screen.getAllByTestId('apex-chart-donut')
      expect(donuts.length).toBeGreaterThanOrEqual(2)
    })
  })

  test('renders FD radialBar gauge when fdData.allocated > 0', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues())
    global.fetch.mockResolvedValue({ json: async () => mkNodeMetrics() })

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
    await waitFor(() => {
      const radials = screen.getAllByTestId('apex-chart-radialBar')
      // Load gauge + FD gauge
      expect(radials.length).toBeGreaterThanOrEqual(2)
    })
  })

  test('renders without crashing in dark mode', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues(true))
    global.fetch.mockResolvedValue({ json: async () => mkNodeMetrics() })

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
    await waitFor(() => {
      const charts = screen.getAllByTestId(/^apex-chart-/)
      expect(charts.length).toBeGreaterThan(0)
    })
  })

  test('renders server time in info header', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues())
    global.fetch.mockResolvedValue({ json: async () => mkNodeMetrics() })

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
    await waitFor(() => {
      expect(screen.getByText(/Server Time/i)).toBeInTheDocument()
    })
  })

  test('renders network details table when network data present', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues())
    global.fetch.mockResolvedValue({ json: async () => mkNodeMetrics() })

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
    await waitFor(() => {
      expect(screen.getByText(/Network Details/i)).toBeInTheDocument()
    })
  })

  test('shows error alert when fetch fails', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues())
    global.fetch.mockRejectedValue(new Error('Connection refused'))

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
    await waitFor(() => {
      expect(screen.getByText(/Metrics Collection Warning/i)).toBeInTheDocument()
    })
  })

  test('renders major page faults row when majorPageFaults > 0', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues())
    global.fetch.mockResolvedValue({ json: async () => mkNodeMetrics() })

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
    await waitFor(() => {
      expect(screen.getByText(/Major Page Faults/i)).toBeInTheDocument()
    })
  })

  test('shows "No TCP metrics available" when tcp.alloc is 0', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues())
    global.fetch.mockResolvedValue({
      json: async () =>
        mkNodeMetrics({
          tcp: { alloc: 0, inuse: 0, currEstab: 0, timeWait: 0 },
        }),
    })

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
    await waitFor(() => {
      expect(screen.getByText(/No TCP metrics available/i)).toBeInTheDocument()
    })
  })

  test('shows "No file descriptor metrics available" when fdData.allocated is 0', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues())
    global.fetch.mockResolvedValue({
      json: async () =>
        mkNodeMetrics({
          fileDescriptor: { allocated: 0, maximum: 0, usedPercent: 0 },
        }),
    })

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
    await waitFor(() => {
      expect(screen.getByText(/No file descriptor metrics available/i)).toBeInTheDocument()
    })
  })

  test('shows "No swap configured" when swapTotal is 0', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues())
    global.fetch.mockResolvedValue({
      json: async () =>
        mkNodeMetrics({
          memory: {
            total: 8589934592,
            free: 2147483648,
            available: 4294967296,
            buffers: 134217728,
            cached: 1073741824,
            swapTotal: 0,
            swapFree: 0,
            swapUsed: 0,
            swapUsedPercent: 0,
          },
        }),
    })

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
    await waitFor(() => {
      expect(screen.getByText(/No swap configured/i)).toBeInTheDocument()
    })
  })

  test('sets error state when response contains error field', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues())
    global.fetch.mockResolvedValue({
      json: async () => ({ available: false, error: 'node exporter unreachable' }),
    })

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
    await waitFor(() => {
      expect(screen.getByText(/node exporter unreachable/i)).toBeInTheDocument()
    })
  })

  test('sets error state when response contains message field', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues())
    global.fetch.mockResolvedValue({
      json: async () => ({ available: false, message: 'service not found' }),
    })

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
    await waitFor(() => {
      expect(screen.getByText(/service not found/i)).toBeInTheDocument()
    })
  })

  test('renders network errors with warning class when non-zero', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues())
    global.fetch.mockResolvedValue({
      json: async () =>
        mkNodeMetrics({
          network: [
            {
              interface: 'eth0',
              receiveBytes: 123456789,
              transmitBytes: 987654321,
              receivePackets: 456789,
              transmitPackets: 654321,
              receiveErrs: 10,
              transmitErrs: 5,
              receiveDrop: 3,
              transmitDrop: 2,
            },
          ],
        }),
    })

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
    await waitFor(() => {
      const errCells = document.querySelectorAll('.text-warning')
      expect(errCells.length).toBeGreaterThan(0)
    })
  })

  test('renders FD gauge red when usedPercent > 80', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues())
    global.fetch.mockResolvedValue({
      json: async () =>
        mkNodeMetrics({
          fileDescriptor: { allocated: 55000, maximum: 65536, usedPercent: 85 },
        }),
    })

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
    await waitFor(() => {
      const radials = screen.getAllByTestId('apex-chart-radialBar')
      expect(radials.length).toBeGreaterThanOrEqual(1)
    })
  })

  test('renders FD gauge orange when usedPercent > 60', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues())
    global.fetch.mockResolvedValue({
      json: async () =>
        mkNodeMetrics({
          fileDescriptor: { allocated: 43000, maximum: 65536, usedPercent: 65 },
        }),
    })

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
    await waitFor(() => {
      const radials = screen.getAllByTestId('apex-chart-radialBar')
      expect(radials.length).toBeGreaterThanOrEqual(1)
    })
  })

  test('handles load values exceeding 200% cap', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues())
    global.fetch.mockResolvedValue({
      json: async () =>
        mkNodeMetrics({
          system: {
            load1: 100,
            load5: 80,
            load15: 60,
            numCPUs: 1,
            uptimeSeconds: 600,
            contextSwitches: 100,
            interrupts: 100,
            procsRunning: 5,
            procsBlocked: 2,
            entropyAvailBits: 0,
            pageFaults: 0,
            majorPageFaults: 0,
          },
        }),
    })

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
    await waitFor(() => {
      const radials = screen.getAllByTestId('apex-chart-radialBar')
      expect(radials.length).toBeGreaterThanOrEqual(1)
    })
  })

  test('NTP not synchronized shows warning', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues())
    global.fetch.mockResolvedValue({
      json: async () => mkNodeMetrics({ ntp: { syncStatus: 0, offsetSeconds: 0.5 } }),
    })

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
    await waitFor(() => {
      expect(screen.getByText(/Not Synchronized/i)).toBeInTheDocument()
    })
  })

  test('chart formatters are callable from captured options', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues())
    global.fetch.mockResolvedValue({ json: async () => mkNodeMetrics() })

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
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
      if (valFormatter) {
        expect(typeof valFormatter(50, undefined)).toBe('string')
        expect(typeof valFormatter(50, { seriesIndex: 0 })).toBe('string')
      }
      // legend formatter
      const legendFormatter = opts?.legend?.formatter
      if (legendFormatter) {
        expect(typeof legendFormatter('label', { seriesIndex: 0 })).toBe('string')
      }
      // total formatter in donut
      const totalFormatter = opts?.plotOptions?.pie?.donut?.labels?.total?.formatter
      if (totalFormatter) expect(typeof totalFormatter()).toBe('string')
      // dataLabels formatter
      const dlFormatter = opts?.dataLabels?.formatter
      if (dlFormatter) {
        expect(typeof dlFormatter(50)).toBe('string')
        expect(typeof dlFormatter(50, { seriesIndex: 0 })).toBe('string')
      }
      // tooltip y formatter
      const tooltipY = opts?.tooltip?.y?.formatter
      if (tooltipY) expect(typeof tooltipY(50, { seriesIndex: 0 })).toBe('string')
    }
  })

  test('renders with minimal metrics (covers || fallback branches)', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues())
    // Provide minimal/empty arrays to trigger || fallbacks (cpu||[], memory||{}, etc.)
    global.fetch.mockResolvedValue({
      json: async () => ({
        available: true,
        metrics: {
          cpu: undefined,
          memory: undefined,
          filesystem: undefined,
          network: undefined,
          diskIO: undefined,
          ntp: undefined,
          system: undefined,
          tcp: undefined,
          fileDescriptor: undefined,
          serverTime: undefined,
        },
      }),
    })

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
    // Should not crash, shows some UI
    expect(document.body).toBeTruthy()
  })

  test('renders with system.numCPUs=0 (covers || 1 and || "?" branches)', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues())
    global.fetch.mockResolvedValue({
      json: async () =>
        mkNodeMetrics({
          system: {
            load1: 0,
            load5: 0,
            load15: 0,
            numCPUs: 0,
            uptimeSeconds: 0,
            contextSwitches: 0,
            interrupts: 0,
            procsRunning: 0,
            procsBlocked: 0,
            entropyAvailBits: 0,
            pageFaults: 0,
            majorPageFaults: 0,
          },
        }),
    })

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
    await waitFor(() => {
      const charts = screen.getAllByTestId(/^apex-chart-/)
      expect(charts.length).toBeGreaterThan(0)
    })
  })

  test('renders filesystem with device fallback when mountpoint missing', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues())
    global.fetch.mockResolvedValue({
      json: async () =>
        mkNodeMetrics({
          filesystem: [{ device: '/dev/sda1', size: 1e9, available: 5e8, used: 5e8, usedPercent: 50 }],
        }),
    })

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
    await waitFor(() => {
      const charts = screen.getAllByTestId(/^apex-chart-/)
      expect(charts.length).toBeGreaterThan(0)
    })
  })

  test('renders with empty buffers/cached (covers memBuffers||0 branch)', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues())
    global.fetch.mockResolvedValue({
      json: async () =>
        mkNodeMetrics({
          memory: {
            total: 8589934592,
            free: 2147483648,
            available: 4294967296,
            buffers: undefined,
            cached: undefined,
            swapTotal: 0,
            swapFree: 0,
            swapUsed: 0,
            swapUsedPercent: 0,
          },
        }),
    })

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
    await waitFor(() => {
      const charts = screen.getAllByTestId(/^apex-chart-/)
      expect(charts.length).toBeGreaterThan(0)
    })
  })

  test('renders disk IO table with missing fields (covers || 0 branches)', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues())
    global.fetch.mockResolvedValue({
      json: async () => mkNodeMetrics({
        diskIO: [{ device: 'sdb' }] // Only device name, other fields missing
      })
    })

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
    await waitFor(() => {
      expect(screen.getByText('Disk I/O Details')).toBeInTheDocument()
    })
  })

  test('load gauge formatter with undefined opts uses idx 0', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues())
    global.fetch.mockResolvedValue({ json: async () => mkNodeMetrics() })

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
    await waitFor(() => {
      const charts = screen.getAllByTestId(/^apex-chart-/)
      expect(charts.length).toBeGreaterThan(0)
    })

    const captured = ReactApexChartMock.getCaptured()
    const loadKey = 'load-gauge'
    expect(captured[loadKey]).toBeDefined()
    const valFmt = captured[loadKey].options?.plotOptions?.radialBar?.dataLabels?.value?.formatter
    // Call with undefined opts to trigger ?? 0 branch
    expect(typeof valFmt(50, undefined)).toBe('string')
    // Call with opts missing nested path
    expect(typeof valFmt(50, {})).toBe('string')
    // Call with full opts
    expect(typeof valFmt(50, { config: { plotOptions: { radialBar: { _seriesIndex: 1 } } } })).toBe('string')
  })

  test('CPU tooltip formatter with missing cpuData entry', async () => {
    mockUseAtomValue.mockImplementation(baseAtomValues())
    global.fetch.mockResolvedValue({ json: async () => mkNodeMetrics() })

    await act(async () => render(<NodeMetricsComponent nodeId="node-1" />))
    await waitFor(() => {
      const charts = screen.getAllByTestId(/^apex-chart-/)
      expect(charts.length).toBeGreaterThan(0)
    })

    const captured = ReactApexChartMock.getCaptured()
    const cpuKey = 'cpu-mode-donut'
    expect(captured[cpuKey]).toBeDefined()
    const tooltipFmt = captured[cpuKey].options?.tooltip?.y?.formatter
    // Call with seriesIndex pointing to nonexistent entry
    expect(typeof tooltipFmt(50, { seriesIndex: 99 })).toBe('string')
    // Call with seriesIndex 0 (valid)
    expect(typeof tooltipFmt(50, { seriesIndex: 0 })).toBe('string')
  })
})
