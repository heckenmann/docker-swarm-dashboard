import { render, screen, cleanup } from '@testing-library/react'
import React from 'react'

// Mock memo to avoid re-render issues in tests
jest.mock('react', () => {
  const original = jest.requireActual('react')
  return {
    ...original,
    memo: (x) => x,
  }
})

// Mock atoms
jest.mock('../../../src/common/store/atoms/themeAtoms', () => ({
  currentVariantAtom: 'currentVariantAtom',
  currentVariantClassesAtom: 'currentVariantClassesAtom',
  isDarkModeAtom: 'isDarkModeAtom',
}))

jest.mock('../../../src/common/store/atoms/uiAtoms', () => ({
  serviceNameFilterAtom: 'serviceNameFilterAtom',
  stackNameFilterAtom: 'stackNameFilterAtom',
}))

jest.mock('../../../src/common/store/atoms/dashboardAtoms', () => ({
  timelineAtom: 'timelineAtom',
}))

// Mock jotai
const mockUseAtomValue = jest.fn()
jest.mock('jotai', () => ({
  useAtomValue: (atom) => mockUseAtomValue(atom),
}))

// Mock ReactApexChart
let lastChartProps = null
jest.mock('react-apexcharts', () => (props) => {
  lastChartProps = props
  return <div data-testid="apex-chart" />
})

// Mock components
jest.mock('../../../src/components/shared/FilterComponent', () => () => <div data-testid="filter-component" />)

const TimelineComponent = require('../../../src/components/timeline/TimelineComponent').default

describe('TimelineComponent', () => {
  beforeEach(() => {
    mockUseAtomValue.mockReset()
    lastChartProps = null
  })

  const mockTimelineData = [
    {
      ID: 't1',
      ServiceName: 'service1',
      Stack: 'stack1',
      Slot: 1,
      CreatedTimestamp: '2023-01-01T10:00:00Z',
      StoppedTimestamp: '2023-01-01T11:00:00Z',
    },
  ]

  const setupMocks = (overrides = {}) => {
    const defaults = {
      currentVariantAtom: 'light',
      currentVariantClassesAtom: 'classes',
      isDarkModeAtom: false,
      serviceNameFilterAtom: '',
      stackNameFilterAtom: '',
      timelineAtom: mockTimelineData,
    }
    const config = { ...defaults, ...overrides }
    mockUseAtomValue.mockImplementation((atom) => config[atom])
  }

  test('renders timeline with chart', () => {
    setupMocks()
    render(<TimelineComponent />)

    expect(screen.getByText('Timeline')).toBeInTheDocument()
    expect(screen.getByTestId('filter-component')).toBeInTheDocument()
    expect(screen.getByTestId('apex-chart')).toBeInTheDocument()
  })

  test('renders message when no data', () => {
    setupMocks({ timelineAtom: [] })
    render(<TimelineComponent />)
    expect(screen.getByText('No timeline data available')).toBeInTheDocument()
  })

  test('filters timeline data', () => {
    setupMocks({ serviceNameFilterAtom: 'non-existent' })
    render(<TimelineComponent />)
    expect(screen.getByText('No timeline data available')).toBeInTheDocument()
  })

  test('handles missing stopped timestamp', () => {
    setupMocks({
      timelineAtom: [
        {
          ID: 't1',
          ServiceName: 'service1',
          CreatedTimestamp: '2023-01-01T10:00:00Z',
          StoppedTimestamp: '',
        },
      ],
    })
    render(<TimelineComponent />)
    expect(screen.getByTestId('apex-chart')).toBeInTheDocument()
  })

  test('calls custom tooltip function', () => {
    setupMocks()
    render(<TimelineComponent />)
    const tooltipFunc = lastChartProps.options.tooltip.custom
    const result = tooltipFunc({ y1: 1000, y2: 2000 })
    expect(result).toContain('Created:')
    expect(result).toContain('Stopped:')
  })

  test('sanitizeSeries handles various malformed data', () => {
    setupMocks({
      timelineAtom: [
        {
          ID: 't1',
          ServiceName: 'service1',
          CreatedTimestamp: 'invalid',
          StoppedTimestamp: '2023-01-01T11:00:00Z',
        },
        {
          ID: 't2',
          ServiceName: null,
          CreatedTimestamp: '2023-01-01T10:00:00Z',
        },
        {
          ID: 't3',
          ServiceName: 'service3',
          CreatedTimestamp: '2023-01-01T10:00:00Z',
          StoppedTimestamp: 'invalid',
        },
      ],
    })
    render(<TimelineComponent />)
  })

  test('covers stack filter and different timestamp fields', () => {
    setupMocks({
      stackNameFilterAtom: 'stack1',
      timelineAtom: [
        {
          ID: 't1',
          ServiceName: 'service1',
          Stack: 'stack1',
          CreatedAt: '2023-01-01T10:00:00Z',
        },
        {
          ID: 't2',
          ServiceName: 'service2',
          Stack: 'stack2',
          Timestamp: '2023-01-01T10:00:00Z',
        },
      ],
    })
    render(<TimelineComponent />)
    expect(screen.getByTestId('apex-chart')).toBeInTheDocument()
  })

  test('covers all timestamp fallback fields', () => {
    const fields = ['CreatedTimestamp', 'createdTimestamp', 'CreatedAt', 'Timestamp']
    fields.forEach((field) => {
      setupMocks({
        timelineAtom: [
          {
            ID: 't-' + field,
            ServiceName: 'svc',
            [field]: '2023-01-01T10:00:00Z',
          },
        ],
      })
      const { unmount } = render(<TimelineComponent />)
      expect(screen.getByTestId('apex-chart')).toBeInTheDocument()
      unmount()
      mockUseAtomValue.mockReset()
    })
  })

  test('covers all filter branches', () => {
    setupMocks({
      serviceNameFilterAtom: 'svc1',
      stackNameFilterAtom: 'stk1',
      timelineAtom: [
        { ID: '1', ServiceName: 'svc1', Stack: 'stk1', CreatedTimestamp: '2023-01-01' },
        { ID: '2', ServiceName: 'svc2', Stack: 'stk1', CreatedTimestamp: '2023-01-01' }, // service mismatch
        { ID: '3', ServiceName: 'svc1', Stack: 'stk2', CreatedTimestamp: '2023-01-01' }, // stack mismatch
        { ID: '4', ServiceName: 'svc1', Stack: null, CreatedTimestamp: '2023-01-01' }, // null stack
      ],
    })
    render(<TimelineComponent />)
    expect(screen.getByTestId('apex-chart')).toBeInTheDocument()
  })

  test('covers non-grouped chart height', () => {
    setupMocks()
    render(<TimelineComponent grouped={false} />)
    expect(screen.getByTestId('apex-chart')).toBeInTheDocument()
  })

  test('covers more empty field branches', () => {
    setupMocks({
      timelineAtom: [
        {
          ServiceName: 'svc',
          CreatedTimestamp: '2023-01-01',
          Slot: 1,
          ID: 'id1',
          StoppedTimestamp: '2023-01-02',
        },
        {
          ServiceName: 'svc2',
          CreatedTimestamp: '2023-01-01',
        },
      ],
    })
    render(<TimelineComponent />)
    expect(screen.getByTestId('apex-chart')).toBeInTheDocument()
  })

  test('covers all timestamp fallback missing', () => {
    setupMocks({
      timelineAtom: [
        {
          ID: 't1',
          ServiceName: 'svc',
        },
      ],
    })
    render(<TimelineComponent />)
    expect(screen.getByText('No timeline data available')).toBeInTheDocument()
  })

  test('covers validateOptions error paths', () => {
    setupMocks()

    const testCases = [
      { override: 'not an object', msg: 'options missing' },
      { override: { chart: {} }, msg: 'chart.type missing or not string' },
      { override: { chart: { type: 'rangeBar' }, theme: {} }, msg: 'theme.mode missing or not string' },
      {
        override: {
          chart: { type: 'rangeBar' },
          theme: { mode: 'dark' },
          colors: [123],
        },
        msg: 'colors must be array of strings',
      },
    ]

    testCases.forEach(({ override, msg }) => {
      const { unmount } = render(<TimelineComponent optionsOverride={override} />)
      expect(screen.getByText(new RegExp('Timeline cannot be rendered: ' + msg))).toBeInTheDocument()
      unmount()
    })
  })

  test('covers validateOptions catch block', () => {
    setupMocks()
    const throwingOptions = {
      get chart() {
        throw new Error('test error')
      },
    }
    render(<TimelineComponent optionsOverride={throwingOptions} />)
    expect(screen.getByText(/Timeline cannot be rendered: Error: test error/)).toBeInTheDocument()
  })

  test('renders in dark mode', () => {
    setupMocks({ isDarkModeAtom: true })
    render(<TimelineComponent />)
    expect(screen.getByTestId('apex-chart')).toBeInTheDocument()
  })

  test('handles null timeline data', () => {
    setupMocks({ timelineAtom: null })
    render(<TimelineComponent />)
    expect(screen.getByText('No timeline data available')).toBeInTheDocument()
  })

  test('handles missing service name and stack name in filter logic', () => {
    setupMocks({
      serviceNameFilterAtom: 'foo',
      timelineAtom: [
        {
          ID: 't1',
          ServiceName: null,
          CreatedTimestamp: '2023-01-01T10:00:00Z',
        },
      ],
    })
    render(<TimelineComponent />)
    expect(screen.getByText('No timeline data available')).toBeInTheDocument()
  })
})
