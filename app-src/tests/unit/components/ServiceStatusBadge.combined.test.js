import { render, screen } from '@testing-library/react'

jest.mock('../../../src/common/store/atoms', () => ({
  dashboardSettingsAtom: {},
}))
jest.mock('jotai', () => ({
  useAtomValue: jest.fn(),
}))
jest.mock('../../../src/common/DefaultDateTimeFormat', () => ({
  toDefaultDateTimeString: jest.fn(),
}))

const { useAtomValue } = require('jotai')
const { toDefaultDateTimeString } = require('../../../src/common/DefaultDateTimeFormat')
const modSSB = require('../../../src/components/services/ServiceStatusBadge')
const ServiceStatusBadge = modSSB.default || modSSB

describe('ServiceStatusBadge (combined)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders simple badge when no tooltip data', () => {
    useAtomValue
      .mockReturnValueOnce({})
      .mockReturnValueOnce('UTC')
      .mockReturnValueOnce('en')
    toDefaultDateTimeString.mockReturnValue('2026-01-18T00:00:00Z')
    render(<ServiceStatusBadge id={1} serviceState={'running'} />)
    expect(screen.getByText('running')).toBeInTheDocument()
  })

  test('renders overlay tooltip when createdAt/updatedAt/serviceError provided', () => {
    useAtomValue
      .mockReturnValueOnce({})
      .mockReturnValueOnce('UTC')
      .mockReturnValueOnce('en')
    toDefaultDateTimeString.mockReturnValue('2026-01-18T00:00:00Z')
    render(
      <ServiceStatusBadge
        id={2}
        serviceState={'failed'}
        createdAt={new Date().toISOString()}
        updatedAt={new Date().toISOString()}
        serviceError={'boom'}
      />,
    )
    expect(screen.getByText('failed')).toBeInTheDocument()
  })

  test('returns nothing when state is hidden', () => {
    useAtomValue
      .mockReturnValueOnce('en')
      .mockReturnValueOnce('UTC')
      .mockReturnValueOnce(['running'])
    toDefaultDateTimeString.mockReturnValue('2026-01-18T00:00:00Z')
    const { container } = render(
      <ServiceStatusBadge
        id={3}
        serviceState={'running'}
        hiddenStates={['running']}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  describe('locale and timezone combinations', () => {
    test('uses default en locale and UTC timezone', () => {
      useAtomValue
        .mockReturnValueOnce({})
        .mockReturnValueOnce('UTC')
        .mockReturnValueOnce('en')
      toDefaultDateTimeString.mockReturnValue('2026-01-18T00:00:00Z')
      render(
        <ServiceStatusBadge
          id={10}
          serviceState={'running'}
          createdAt={new Date().toISOString()}
        />,
      )
      expect(toDefaultDateTimeString).toHaveBeenCalledWith(
        expect.any(Date),
        'en',
        'UTC',
      )
    })

    test('uses de locale with Europe/Berlin timezone', () => {
      useAtomValue
        .mockReturnValueOnce({})
        .mockReturnValueOnce('Europe/Berlin')
        .mockReturnValueOnce('de')
      toDefaultDateTimeString.mockReturnValue('18.01.2026 01:00:00')
      render(
        <ServiceStatusBadge
          id={11}
          serviceState={'running'}
          createdAt={new Date().toISOString()}
        />,
      )
      expect(toDefaultDateTimeString).toHaveBeenCalledWith(
        expect.any(Date),
        'de',
        'Europe/Berlin',
      )
    })

    test('handles empty strings for locale and timeZone', () => {
      useAtomValue
        .mockReturnValueOnce({})
        .mockReturnValueOnce('')
        .mockReturnValueOnce('')
      toDefaultDateTimeString.mockReturnValue('2026-01-18T00:00:00Z')
      render(
        <ServiceStatusBadge
          id={12}
          serviceState={'running'}
          createdAt={new Date().toISOString()}
        />,
      )
      expect(toDefaultDateTimeString).toHaveBeenCalledWith(
        expect.any(Date),
        '',
        '',
      )
    })

    test('handles undefined values for locale and timeZone', () => {
      useAtomValue
        .mockReturnValueOnce({})
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(undefined)
      toDefaultDateTimeString.mockReturnValue('2026-01-18T00:00:00Z')
      render(
        <ServiceStatusBadge
          id={13}
          serviceState={'running'}
          createdAt={new Date().toISOString()}
        />,
      )
      expect(toDefaultDateTimeString).toHaveBeenCalledWith(
        expect.any(Date),
        undefined,
        undefined,
      )
    })

    test('uses en-US locale with America/New_York timezone', () => {
      useAtomValue
        .mockReturnValueOnce({})
        .mockReturnValueOnce('America/New_York')
        .mockReturnValueOnce('en-US')
      toDefaultDateTimeString.mockReturnValue('01/18/2026 12:00:00 AM')
      render(
        <ServiceStatusBadge
          id={14}
          serviceState={'running'}
          createdAt={new Date().toISOString()}
        />,
      )
      expect(toDefaultDateTimeString).toHaveBeenCalledWith(
        expect.any(Date),
        'en-US',
        'America/New_York',
      )
    })

    test('uses ja locale with Asia/Tokyo timezone', () => {
      useAtomValue
        .mockReturnValueOnce({})
        .mockReturnValueOnce('Asia/Tokyo')
        .mockReturnValueOnce('ja')
      toDefaultDateTimeString.mockReturnValue('2026/01/18 09:00:00')
      render(
        <ServiceStatusBadge
          id={15}
          serviceState={'running'}
          createdAt={new Date().toISOString()}
        />,
      )
      expect(toDefaultDateTimeString).toHaveBeenCalledWith(
        expect.any(Date),
        'ja',
        'Asia/Tokyo',
      )
    })
  })
})
