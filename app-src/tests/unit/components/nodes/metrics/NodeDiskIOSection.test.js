/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import NodeDiskIOSection from '../../../../../src/components/nodes/metrics/NodeDiskIOSection'

// Mock jotai - provide atoms
jest.mock('jotai', () => ({
  useAtomValue: jest.fn(() => false),
  atom: jest.fn((v) => v),
}))

jest.mock('../../../../../src/common/store/atoms/themeAtoms', () => ({
  isDarkModeAtom: { toString: () => 'isDarkModeAtom' },
  tableSizeAtom: { toString: () => 'tableSizeAtom' },
}))

jest.mock('react-apexcharts', () => jest.fn(() => <div data-testid="chart" />))

jest.mock('../../../../../src/common/formatUtils', () => ({
  formatBytes: (v) => v,
}))

jest.mock('../../../../../src/common/chartUtils', () => ({
  getCommonChartOptions: () => ({
    chart: {},
    theme: { mode: 'light' },
  }),
}))

jest.mock('react-bootstrap', () => {
  const React = require('react')
  const Alert = ({ children }) => <div>{children}</div>
  const Row = ({ children }) => <div>{children}</div>
  const Col = ({ children }) => <div>{children}</div>
  const Table = ({ children }) => <table>{children}</table>
  const Card = ({ children }) => <div>{children}</div>
  Card.Header = ({ children }) => <div>{children}</div>
  Card.Body = ({ children }) => <div>{children}</div>
  const Spinner = () => <span>Loading...</span>

  return { Alert, Row, Col, Table, Card, Spinner }
})

const mockDiskIOData = [
  {
    device: 'sda',
    readsCompleted: 1000,
    writesCompleted: 500,
    readBytes: 1048576,
    writtenBytes: 524288,
    ioTimeSeconds: 10.5,
    ioTimeWeightedSeconds: 5.2,
  },
]

describe('NodeDiskIOSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders table with disk data', () => {
    render(<NodeDiskIOSection diskIOData={mockDiskIOData} />)
    expect(screen.getByText('sda')).toBeInTheDocument()
  })

  it('shows no metrics message when empty', () => {
    render(<NodeDiskIOSection diskIOData={[]} />)
    expect(screen.getByText('No disk I/O metrics available')).toBeInTheDocument()
  })

  it('renders headers with data', () => {
    render(<NodeDiskIOSection diskIOData={mockDiskIOData} />)
    expect(screen.getByText('Device')).toBeInTheDocument()
  })
})
