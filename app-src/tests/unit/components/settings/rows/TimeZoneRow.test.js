/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { TimeZoneRow } from '../../../../../src/components/settings/rows/TimeZoneRow'

const mockUseAtomValue = jest.fn()
const mockSetTimeZone = jest.fn()
const mockUseAtom = jest.fn()

jest.mock('jotai', () => ({
  useAtomValue: (...args) => mockUseAtomValue(...args),
  useAtom: (...args) => mockUseAtom(...args),
}))

jest.mock('../../../../../src/common/store/atoms', () => ({
  timeZoneAtom: 'timeZoneAtom',
  dashboardSettingsAtom: 'dashboardSettingsAtom',
}))

describe('TimeZoneRow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAtomValue.mockReturnValue({
      timeZone: 'UTC',
    })
    mockUseAtom.mockReturnValue(['UTC', mockSetTimeZone])
  })

  describe('initial state', () => {
    it('renders the component with timeZone input', () => {
      render(<TimeZoneRow />)

      expect(screen.getByText('Time zone')).toBeInTheDocument()
      expect(screen.getByLabelText('Time zone')).toBeInTheDocument()
    })

    it('displays the current timeZone value in the input', () => {
      mockUseAtom.mockReturnValue(['UTC', mockSetTimeZone])
      render(<TimeZoneRow />)

      const input = screen.getByLabelText('Time zone')
      expect(input).toHaveValue('UTC')
    })

    it('displays empty string when timeZone is not set', () => {
      mockUseAtom.mockReturnValue(['', mockSetTimeZone])
      render(<TimeZoneRow />)

      const input = screen.getByLabelText('Time zone')
      expect(input).toHaveValue('')
    })

    it('renders the reset button', () => {
      render(<TimeZoneRow />)

      expect(screen.getByLabelText('Reset time zone to default')).toBeInTheDocument()
    })
  })

  describe('timeZone input change', () => {
    it('updates timeZone when typing in the input', () => {
      mockUseAtom.mockReturnValue(['', mockSetTimeZone])
      render(<TimeZoneRow />)

      const input = screen.getByLabelText('Time zone')
      fireEvent.change(input, { target: { value: 'America/New_York' } })

      expect(mockSetTimeZone).toHaveBeenCalledWith('America/New_York')
    })

    it('updates timeZone to empty string when input is cleared', () => {
      mockUseAtom.mockReturnValue(['UTC', mockSetTimeZone])
      render(<TimeZoneRow />)

      const input = screen.getByLabelText('Time zone')
      fireEvent.change(input, { target: { value: '' } })

      expect(mockSetTimeZone).toHaveBeenCalledWith('')
    })

    it('handles various time zone formats', () => {
      mockUseAtom.mockReturnValue(['', mockSetTimeZone])
      render(<TimeZoneRow />)

      const input = screen.getByLabelText('Time zone')
      
      fireEvent.change(input, { target: { value: 'Europe/London' } })
      expect(mockSetTimeZone).toHaveBeenCalledWith('Europe/London')
      
      fireEvent.change(input, { target: { value: 'Asia/Tokyo' } })
      expect(mockSetTimeZone).toHaveBeenCalledWith('Asia/Tokyo')
    })
  })

  describe('reset button', () => {
    it('resets timeZone to dashboard settings default', () => {
      mockUseAtom.mockReturnValue(['America/New_York', mockSetTimeZone])
      mockUseAtomValue.mockReturnValue({
        timeZone: 'UTC',
      })

      render(<TimeZoneRow />)

      fireEvent.click(screen.getByLabelText('Reset time zone to default'))

      expect(mockSetTimeZone).toHaveBeenCalledWith('UTC')
    })

    it('resets to empty string when dashboard settings has no timeZone', () => {
      mockUseAtom.mockReturnValue(['America/New_York', mockSetTimeZone])
      mockUseAtomValue.mockReturnValue({})

      render(<TimeZoneRow />)

      fireEvent.click(screen.getByLabelText('Reset time zone to default'))

      expect(mockSetTimeZone).toHaveBeenCalledWith('')
    })

    it('resets to empty string when dashboard settings timeZone is undefined', () => {
      mockUseAtom.mockReturnValue(['America/New_York', mockSetTimeZone])
      mockUseAtomValue.mockReturnValue({
        timeZone: undefined,
      })

      render(<TimeZoneRow />)

      fireEvent.click(screen.getByLabelText('Reset time zone to default'))

      expect(mockSetTimeZone).toHaveBeenCalledWith('')
    })
  })
})