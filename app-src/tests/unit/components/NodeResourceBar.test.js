import { render, screen } from '@testing-library/react'
import NodeResourceBar from '../../../src/components/nodes/NodeResourceBar'

// Mock dependencies
const mockUseAtomValue = jest.fn()
jest.mock('jotai', () => ({
  useAtomValue: (atom) => mockUseAtomValue(atom),
}))

jest.mock('jotai/utils', () => ({
  atomFamily: (fn) => (id) => ({ debugLabel: 'atomFamily', id }),
  loadable: (atom) => ({ debugLabel: 'loadable', inner: atom }),
}))

jest.mock('../../../src/common/store/atoms/dashboardAtoms', () => ({
  nodeMetricsAtomFamily: (id) => ({ debugLabel: 'nodeMetricsAtomFamily', id }),
}))

jest.mock('../../../src/common/utils/formatUtils', () => ({
  formatBytesCompact: (bytes) => `${bytes} bytes`,
}))

describe('NodeResourceBar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders loading state initially', () => {
    mockUseAtomValue.mockReturnValue({ state: 'loading' })
    render(<NodeResourceBar nodeId="node-1" type="memory" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  test('renders memory bar when metrics are available', () => {
    mockUseAtomValue.mockReturnValue({
      state: 'hasData',
      data: {
        available: true,
        metrics: {
          memory: {
            total: 8589934592,
            available: 4294967296,
          },
        },
      },
    })

    render(<NodeResourceBar nodeId="node-1" type="memory" />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  test('renders disk bar with root partition', () => {
    mockUseAtomValue.mockReturnValue({
      state: 'hasData',
      data: {
        available: true,
        metrics: {
          filesystem: [
            {
              mountpoint: '/',
              size: 107374182400,
              used: 53687091200,
            },
          ],
        },
      },
    })

    render(<NodeResourceBar nodeId="node-1" type="disk" />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  test('renders N/A when metrics are unavailable', () => {
    mockUseAtomValue.mockReturnValue({
      state: 'hasData',
      data: { available: false },
    })

    render(<NodeResourceBar nodeId="node-1" type="memory" />)
    expect(screen.getByText('N/A')).toBeInTheDocument()
  })

  test('renders N/A when total is 0', () => {
    mockUseAtomValue.mockReturnValue({
      state: 'hasData',
      data: {
        available: true,
        metrics: {
          memory: { total: 0, available: 0 },
        },
      },
    })

    render(<NodeResourceBar nodeId="node-1" type="memory" />)
    expect(screen.getByText('N/A')).toBeInTheDocument()
  })

  test('renders N/A when metrics data is missing', () => {
    mockUseAtomValue.mockReturnValue({
      state: 'hasData',
      data: { available: true, metrics: null },
    })

    render(<NodeResourceBar nodeId="node-1" type="memory" />)
    expect(screen.getByText('N/A')).toBeInTheDocument()
  })

  test('handles fetch errors gracefully (hasError state)', () => {
    mockUseAtomValue.mockReturnValue({
      state: 'hasError',
      error: new Error('Failed'),
    })

    render(<NodeResourceBar nodeId="node-1" type="memory" />)
    expect(screen.getByText('N/A')).toBeInTheDocument()
  })

  test('supports PascalCase metric keys', () => {
    mockUseAtomValue.mockReturnValue({
      state: 'hasData',
      data: {
        available: true,
        metrics: {
          Memory: {
            Total: 8589934592,
            Available: 4294967296,
          },
        },
      },
    })

    render(<NodeResourceBar nodeId="node-1" type="memory" />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  test('uses fallback filesystem when root partition not found', () => {
    mockUseAtomValue.mockReturnValue({
      state: 'hasData',
      data: {
        available: true,
        metrics: {
          filesystem: [
            {
              mountpoint: '/data',
              size: 536870912000,
              used: 268435456000,
            },
          ],
        },
      },
    })

    render(<NodeResourceBar nodeId="node-1" type="disk" />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  test('applies correct variants based on usage percentage', () => {
    // 95% usage -> danger
    mockUseAtomValue.mockReturnValue({
      state: 'hasData',
      data: {
        available: true,
        metrics: {
          memory: { total: 100, available: 5 },
        },
      },
    })
    const { rerender } = render(<NodeResourceBar nodeId="node-1" type="memory" />)
    expect(screen.getByRole('progressbar')).toHaveClass('bg-danger')

    // 80% usage -> warning
    mockUseAtomValue.mockReturnValue({
      state: 'hasData',
      data: {
        available: true,
        metrics: {
          memory: { total: 100, available: 20 },
        },
      },
    })
    render(<NodeResourceBar nodeId="node-1-warning" type="memory" />)
    expect(screen.getAllByRole('progressbar')[1]).toHaveClass('bg-warning')

    // 50% usage -> success
    mockUseAtomValue.mockReturnValue({
      state: 'hasData',
      data: {
        available: true,
        metrics: {
          memory: { total: 100, available: 50 },
        },
      },
    })
    render(<NodeResourceBar nodeId="node-1-success" type="memory" />)
    expect(screen.getAllByRole('progressbar')[2]).toHaveClass('bg-success')
  })

  test('supports PascalCase keys for disk metrics', () => {
    mockUseAtomValue.mockReturnValue({
      state: 'hasData',
      data: {
        available: true,
        metrics: {
          Filesystem: [
            {
              Mountpoint: '/',
              Size: 1000,
              Used: 500,
            },
          ],
        },
      },
    })
    render(<NodeResourceBar nodeId="node-1" type="disk" />)
    expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0)
  })

  test('renders N/A when type is disk but filesystem metrics are missing', () => {
    mockUseAtomValue.mockReturnValue({
      state: 'hasData',
      data: {
        available: true,
        metrics: {
          memory: { total: 1000, available: 500 },
          // filesystem missing
        },
      },
    })
    render(<NodeResourceBar nodeId="node-disk-missing" type="disk" />)
    expect(screen.getByText('N/A')).toBeInTheDocument()
  })

  test('handles zero size filesystem', () => {
    mockUseAtomValue.mockReturnValue({
      state: 'hasData',
      data: {
        available: true,
        metrics: {
          filesystem: [{ mountpoint: '/', size: 0, used: 0 }],
        },
      },
    })
    render(<NodeResourceBar nodeId="node-disk-zero" type="disk" />)
    expect(screen.getByText('N/A')).toBeInTheDocument()
  })

  test('handles empty filesystem array', () => {
    mockUseAtomValue.mockReturnValue({
      state: 'hasData',
      data: {
        available: true,
        metrics: {
          filesystem: [],
        },
      },
    })
    render(<NodeResourceBar nodeId="node-disk-empty" type="disk" />)
    expect(screen.getByText('N/A')).toBeInTheDocument()
  })
})
