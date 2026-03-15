import { render, screen } from '@testing-library/react'

// Mock atoms module BEFORE importing the component
jest.mock('../../../src/common/store/atoms', () => ({
  hiddenServiceStatesAtom: 'hiddenServiceStatesAtom',
  timeZoneAtom: 'timeZoneAtom',
  localeAtom: 'localeAtom',
}))

// Mock jotai AFTER atoms module mock
const mockUseAtomValue = jest.fn()
jest.mock('jotai', () => ({
  useAtomValue: (...args) => mockUseAtomValue(...args),
}))

// Mock DefaultDateTimeFormat
jest.mock('../../../src/common/DefaultDateTimeFormat', () => ({
  toDefaultDateTimeString: jest.fn().mockReturnValue('2026-01-18 00:00:00'),
}))

const { useAtomValue } = require('jotai')
const { toDefaultDateTimeString } = require('../../../src/common/DefaultDateTimeFormat')
const modSSB = require('../../../src/components/services/ServiceStatusBadge')
const ServiceStatusBadge = modSSB.default || modSSB

describe('ServiceStatusBadge (combined)', () => {
  beforeEach(() => {
    mockUseAtomValue.mockReset()
  })

  test('renders simple badge when no tooltip data', () => {
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'hiddenServiceStatesAtom') return []
      if (atom === 'timeZoneAtom') return 'UTC'
      if (atom === 'localeAtom') return 'en'
      return ''
    })
    render(<ServiceStatusBadge id={1} serviceState={'running'} />)
    expect(screen.getByText('running')).toBeInTheDocument()
  })

  test('renders badge with failed state', () => {
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'hiddenServiceStatesAtom') return []
      if (atom === 'timeZoneAtom') return 'UTC'
      if (atom === 'localeAtom') return 'en'
      return ''
    })
    render(<ServiceStatusBadge id={2} serviceState={'failed'} />)
    expect(screen.getByText('failed')).toBeInTheDocument()
  })

  test('returns nothing when state is hidden', () => {
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'hiddenServiceStatesAtom') return ['running']
      if (atom === 'timeZoneAtom') return 'UTC'
      if (atom === 'localeAtom') return 'en'
      return ''
    })
    const { container } = render(
      <ServiceStatusBadge
        id={3}
        serviceState={'running'}
        hiddenStates={['running']}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  test('renders badge with correct variant for each state', () => {
    const stateVariants = [
      { state: 'running', variant: 'success' },
      { state: 'failed', variant: 'danger' },
      { state: 'shutdown', variant: 'dark' },
      { state: 'new', variant: 'warning' },
      { state: 'unknown', variant: 'secondary' },
    ]
    
    stateVariants.forEach(({ state, variant }) => {
      mockUseAtomValue.mockImplementation((atom) => {
        if (atom === 'hiddenServiceStatesAtom') return []
        if (atom === 'timeZoneAtom') return 'UTC'
        if (atom === 'localeAtom') return 'en'
        return ''
      })
      render(<ServiceStatusBadge id={1} serviceState={state} />)
      
      const badge = screen.getByText(state)
      // Check that the badge has the correct variant class
      expect(badge.className).toContain(`bg-${variant}`)
      
      mockUseAtomValue.mockReset()
    })
  })

  test('uses default en locale and UTC timezone for formatting', () => {
    const mockDate = new Date('2026-01-18T00:00:00Z')
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'hiddenServiceStatesAtom') return []
      if (atom === 'timeZoneAtom') return 'UTC'
      if (atom === 'localeAtom') return 'en'
      return ''
    })
    render(
      <ServiceStatusBadge
        id={10}
        serviceState={'running'}
        createdAt={mockDate.toISOString()}
      />,
    )
    expect(toDefaultDateTimeString).toHaveBeenCalledWith(
      expect.any(Date),
      'en',
      'UTC',
    )
  })

  test('uses de locale with Europe/Berlin timezone for formatting', () => {
    const mockDate = new Date('2026-01-18T00:00:00Z')
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'hiddenServiceStatesAtom') return []
      if (atom === 'timeZoneAtom') return 'Europe/Berlin'
      if (atom === 'localeAtom') return 'de'
      return ''
    })
    render(
      <ServiceStatusBadge
        id={11}
        serviceState={'running'}
        createdAt={mockDate.toISOString()}
      />,
    )
    expect(toDefaultDateTimeString).toHaveBeenCalledWith(
      expect.any(Date),
      'de',
      'Europe/Berlin',
    )
  })

  test('handles empty strings for locale and timeZone gracefully', () => {
    const mockDate = new Date('2026-01-18T00:00:00Z')
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'hiddenServiceStatesAtom') return []
      if (atom === 'timeZoneAtom') return ''
      if (atom === 'localeAtom') return ''
      return ''
    })
    render(
      <ServiceStatusBadge
        id={12}
        serviceState={'running'}
        createdAt={mockDate.toISOString()}
      />,
    )
    expect(toDefaultDateTimeString).toHaveBeenCalledWith(
      expect.any(Date),
      '',
      '',
    )
  })

  test('handles undefined values for locale and timeZone gracefully', () => {
    const mockDate = new Date('2026-01-18T00:00:00Z')
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'hiddenServiceStatesAtom') return []
      if (atom === 'timeZoneAtom') return undefined
      if (atom === 'localeAtom') return undefined
      return ''
    })
    render(
      <ServiceStatusBadge
        id={13}
        serviceState={'running'}
        createdAt={mockDate.toISOString()}
      />,
    )
    expect(toDefaultDateTimeString).toHaveBeenCalledWith(
      expect.any(Date),
      undefined,
      undefined,
    )
  })

  test('uses en-US locale with America/New_York timezone', () => {
    const mockDate = new Date('2026-01-18T05:00:00Z')
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'hiddenServiceStatesAtom') return []
      if (atom === 'timeZoneAtom') return 'America/New_York'
      if (atom === 'localeAtom') return 'en-US'
      return ''
    })
    render(
      <ServiceStatusBadge
        id={14}
        serviceState={'running'}
        createdAt={mockDate.toISOString()}
      />,
    )
    expect(toDefaultDateTimeString).toHaveBeenCalledWith(
      expect.any(Date),
      'en-US',
      'America/New_York',
    )
  })

  test('uses ja locale with Asia/Tokyo timezone', () => {
    const mockDate = new Date('2026-01-17T15:00:00Z')
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'hiddenServiceStatesAtom') return []
      if (atom === 'timeZoneAtom') return 'Asia/Tokyo'
      if (atom === 'localeAtom') return 'ja'
      return ''
    })
    render(
      <ServiceStatusBadge
        id={15}
        serviceState={'running'}
        createdAt={mockDate.toISOString()}
      />,
    )
    expect(toDefaultDateTimeString).toHaveBeenCalledWith(
      expect.any(Date),
      'ja',
      'Asia/Tokyo',
    )
  })
})
