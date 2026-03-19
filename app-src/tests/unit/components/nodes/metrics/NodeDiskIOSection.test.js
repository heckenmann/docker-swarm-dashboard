/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { NodeDiskIOSection } from '../../../../../src/components/nodes/metrics/NodeDiskIOSection'

jest.mock('react-bootstrap', () => ({
  Alert: jest.fn(({ children }) => <div>{children}</div>),
  Row: jest.fn(({ children }) => <div>{children}</div>),
  Col: jest.fn(({ children }) => <div>{children}</div>),
  Table: jest.fn(({ children }) => <table>{children}</table>),
}))

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
    expect(screen.getByText('500')).toBeInTheDocument()
  })

  it('renders Device header', () => {
    render(<NodeDiskIOSection diskIOData={mockDiskIOData} />)
    expect(screen.getByText('Device')).toBeInTheDocument()
  })
})
