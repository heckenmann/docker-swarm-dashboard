import { render, screen } from '@testing-library/react'
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
jest.mock('react-apexcharts', () => () => <div data-testid="apex-chart" />)

// Mock components
jest.mock('../../../src/components/shared/FilterComponent', () => () => <div data-testid="filter-component" />)

const TimelineComponent = require('../../../src/components/timeline/TimelineComponent').default

describe('TimelineComponent', () => {
  beforeEach(() => {
    mockUseAtomValue.mockReset()
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
})
