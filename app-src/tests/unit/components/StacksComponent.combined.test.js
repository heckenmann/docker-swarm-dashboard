import { render, screen, fireEvent } from '@testing-library/react'
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
}))

jest.mock('../../../src/common/store/atoms/dashboardAtoms', () => ({
  stacksAtom: 'stacksAtom',
}))

jest.mock('../../../src/common/store/atoms/uiAtoms', () => ({
  localeAtom: 'localeAtom',
  timeZoneAtom: 'timeZoneAtom',
  serviceNameFilterAtom: 'serviceNameFilterAtom',
  stackNameFilterAtom: 'stackNameFilterAtom',
  tableSizeAtom: 'tableSizeAtom',
}))

// Mock jotai
const mockUseAtomValue = jest.fn()
jest.mock('jotai', () => ({
  useAtomValue: (atom) => mockUseAtomValue(atom),
}))

// Mock components to simplify rendering
jest.mock('../../../src/components/shared/names/StackName', () => ({ name }) => <div data-testid="stack-name">{name}</div>)
jest.mock('../../../src/components/shared/names/ServiceName', () => ({ name }) => <div data-testid="service-name">{name}</div>)
jest.mock('../../../src/components/shared/FilterComponent', () => () => <div data-testid="filter-component" />)
jest.mock('../../../src/components/common/DSDCard.jsx', () => ({ title, body, headerActions }) => (
  <div data-testid="dsd-card">
    <div data-testid="card-title">{title}</div>
    {headerActions}
    <div data-testid="card-body">{body}</div>
  </div>
))

const StacksComponent = require('../../../src/components/stacks/StacksComponent').default

describe('StacksComponent', () => {
  beforeEach(() => {
    mockUseAtomValue.mockReset()
  })

  const mockStacksData = [
    {
      Name: 'stack1',
      Services: [
        {
          ID: 's1',
          ServiceName: 'service1',
          ShortName: 'svc1',
          Replication: '1/1',
          Created: '2023-01-01T10:00:00Z',
          Updated: '2023-01-01T11:00:00Z',
        },
      ],
    },
  ]

  const setupMocks = (overrides = {}) => {
    const defaults = {
      currentVariantAtom: 'light',
      stacksAtom: mockStacksData,
      localeAtom: 'en-US',
      timeZoneAtom: 'UTC',
      serviceNameFilterAtom: '',
      stackNameFilterAtom: '',
      tableSizeAtom: 'sm',
    }
    const config = { ...defaults, ...overrides }
    mockUseAtomValue.mockImplementation((atom) => config[atom])
  }

  test('renders stacks and services', () => {
    setupMocks()
    render(<StacksComponent />)

    expect(screen.getByText('Stacks')).toBeInTheDocument()
    expect(screen.getByTestId('filter-component')).toBeInTheDocument()
    expect(screen.getByText('stack1')).toBeInTheDocument()
    expect(screen.getByText('svc1')).toBeInTheDocument()
    expect(screen.getByText('1/1')).toBeInTheDocument()
  })

  test('filters by stack name', () => {
    setupMocks({ stackNameFilterAtom: 'other-stack' })
    render(<StacksComponent />)
    expect(screen.queryByText('stack1')).not.toBeInTheDocument()
  })

  test('filters by service name', () => {
    setupMocks({ serviceNameFilterAtom: 'service1' })
    const { rerender } = render(<StacksComponent />)

    expect(screen.getByText('stack1')).toBeInTheDocument()
    expect(screen.getByText('svc1')).toBeInTheDocument()

    // Filter out everything
    setupMocks({ serviceNameFilterAtom: 'non-existent' })
    rerender(<StacksComponent />)
    expect(screen.queryByText('stack1')).not.toBeInTheDocument()
  })

  test('handles sorting', () => {
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'stacksAtom') return mockStacksData
      return ''
    })

    render(<StacksComponent />)

    const serviceHeader = screen.getByText('Service Name')
    fireEvent.click(serviceHeader)
    
    // Check if sorting state changed (this is harder to verify since it's internal state, 
    // but we can check if it re-renders or if the sortData util would be called with right params)
    // For now, just ensuring it doesn't crash on click.
  })
})
