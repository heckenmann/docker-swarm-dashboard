import { render, screen } from '@testing-library/react'
import { useAtomValue } from 'jotai'
import ClusterMetricsHeader from '../../../src/components/nodes/ClusterMetricsHeader'

// Mock dependencies
jest.mock('jotai', () => ({
  useAtomValue: jest.fn(),
}))

jest.mock('jotai/utils', () => ({
  loadable: (atom) => atom, // Simple bypass for testing
}))

jest.mock('../../../src/common/store/atoms/dashboardAtoms', () => ({
  clusterMetricsAtom: { debugLabel: 'clusterMetricsAtom' },
}))

jest.mock('../../../src/common/utils/formatUtils', () => ({
  formatBytes: (bytes) => `${bytes} bytes`,
}))

describe('ClusterMetricsHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders spinner during loading', () => {
    useAtomValue.mockReturnValue({ state: 'loading' })
    render(<ClusterMetricsHeader />)
    expect(screen.getByText(/Loading cluster metrics/i)).toBeInTheDocument()
  })

  test('renders error alert when state is hasError', () => {
    // Provide a mocked data object even in hasError state to see if it defaults correctly
    useAtomValue.mockReturnValue({ state: 'hasError', error: 'Network failure', data: null })
    render(<ClusterMetricsHeader />)
    expect(screen.getByText(/Cluster metrics warning:/i)).toBeInTheDocument()
    expect(screen.getByText(/Network failure/i)).toBeInTheDocument()
  })

  test('renders error alert when data contains error', () => {
    useAtomValue.mockReturnValue({ state: 'hasData', data: { available: true, error: 'API Error' } })
    render(<ClusterMetricsHeader />)
    expect(screen.getByText(/API Error/i)).toBeInTheDocument()
  })

  test('renders info alert when metrics are not available', () => {
    useAtomValue.mockReturnValue({ state: 'hasData', data: { available: false } })
    render(<ClusterMetricsHeader />)
    expect(screen.getByText(/Cluster-wide metrics are not enabled/i)).toBeInTheDocument()
  })

  test('renders info alert when metrics are not available with generic label hint', () => {
    useAtomValue.mockReturnValue({ state: 'hasData', data: { available: false, message: 'other-label' } })
    render(<ClusterMetricsHeader />)
    expect(screen.getByText(/your configured label/i)).toBeInTheDocument()
  })

  test('renders error alert with default message when no error provided', () => {
    useAtomValue.mockReturnValue({ state: 'hasError' })
    render(<ClusterMetricsHeader />)
    expect(screen.getByText(/Failed to fetch metrics from nodes/i)).toBeInTheDocument()
  })

  test('renders metrics cards when data is available', () => {
    const mockData = {
      available: true,
      totalCpu: 16,
      nodesAvailable: 4,
      usedMemory: 8000,
      totalMemory: 16000,
      memoryPercent: 50,
      usedDisk: 500,
      totalDisk: 1000,
      diskPercent: 50
    }
    useAtomValue.mockReturnValue({ state: 'hasData', data: mockData })
    
    render(<ClusterMetricsHeader />)
    
    expect(screen.getByText('Cluster CPU')).toBeInTheDocument()
    expect(screen.getByText('16')).toBeInTheDocument()
    expect(screen.getByText(/Aggregated from 4 nodes/i)).toBeInTheDocument()
    
    expect(screen.getByText('Cluster Memory')).toBeInTheDocument()
    expect(screen.getAllByText('50.0%')[0]).toBeInTheDocument()
    
    expect(screen.getByText('Cluster Disk')).toBeInTheDocument()
    expect(screen.getAllByText('50.0%')[1]).toBeInTheDocument()
  })

  test('renders progress bars with correct variants', () => {
    const mockData = {
      available: true,
      totalCpu: 16,
      nodesAvailable: 4,
      usedMemory: 15000,
      totalMemory: 16000,
      memoryPercent: 95, // Red
      usedDisk: 800,
      totalDisk: 1000,
      diskPercent: 80 // Warning
    }
    useAtomValue.mockReturnValue({ state: 'hasData', data: mockData })
    
    const { container } = render(<ClusterMetricsHeader />)
    
    const progressBars = container.querySelectorAll('.progress-bar')
    expect(progressBars[0]).toHaveClass('bg-danger') // Memory
    expect(progressBars[1]).toHaveClass('bg-warning') // Disk
  })
})
