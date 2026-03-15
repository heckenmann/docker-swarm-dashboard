/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { LocaleRow } from '../../../../../src/components/settings/rows/LocaleRow'

const mockUseAtomValue = jest.fn()
const mockSetLocale = jest.fn()
const mockUseAtom = jest.fn()

jest.mock('jotai', () => ({
  useAtomValue: (...args) => mockUseAtomValue(...args),
  useAtom: (...args) => mockUseAtom(...args),
}))

jest.mock('../../../../../src/common/store/atoms', () => ({
  localeAtom: 'localeAtom',
  dashboardSettingsAtom: 'dashboardSettingsAtom',
}))

describe('LocaleRow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAtomValue.mockReturnValue({
      locale: 'en-US',
    })
    mockUseAtom.mockReturnValue(['en-US', mockSetLocale])
  })

  describe('initial state', () => {
    it('renders the component with locale input', () => {
      render(<LocaleRow />)

      expect(screen.getByText('Locale')).toBeInTheDocument()
      expect(screen.getByLabelText('Locale')).toBeInTheDocument()
    })

    it('displays the current locale value in the input', () => {
      mockUseAtom.mockReturnValue(['en-US', mockSetLocale])
      render(<LocaleRow />)

      const input = screen.getByLabelText('Locale')
      expect(input).toHaveValue('en-US')
    })

    it('displays empty string when locale is not set', () => {
      mockUseAtom.mockReturnValue(['', mockSetLocale])
      render(<LocaleRow />)

      const input = screen.getByLabelText('Locale')
      expect(input).toHaveValue('')
    })

    it('renders the reset button', () => {
      render(<LocaleRow />)

      expect(screen.getByLabelText('Reset locale to default')).toBeInTheDocument()
    })
  })

  describe('locale input change', () => {
    it('updates locale when typing in the input', () => {
      mockUseAtom.mockReturnValue(['', mockSetLocale])
      render(<LocaleRow />)

      const input = screen.getByLabelText('Locale')
      fireEvent.change(input, { target: { value: 'fr-FR' } })

      expect(mockSetLocale).toHaveBeenCalledWith('fr-FR')
    })

    it('updates locale to empty string when input is cleared', () => {
      mockUseAtom.mockReturnValue(['en-US', mockSetLocale])
      render(<LocaleRow />)

      const input = screen.getByLabelText('Locale')
      fireEvent.change(input, { target: { value: '' } })

      expect(mockSetLocale).toHaveBeenCalledWith('')
    })

    it('handles various locale formats', () => {
      mockUseAtom.mockReturnValue(['', mockSetLocale])
      render(<LocaleRow />)

      const input = screen.getByLabelText('Locale')
      
      fireEvent.change(input, { target: { value: 'de-DE' } })
      expect(mockSetLocale).toHaveBeenCalledWith('de-DE')
      
      fireEvent.change(input, { target: { value: 'ja-JP' } })
      expect(mockSetLocale).toHaveBeenCalledWith('ja-JP')
    })
  })

  describe('reset button', () => {
    it('resets locale to dashboard settings default', () => {
      mockUseAtom.mockReturnValue(['fr-FR', mockSetLocale])
      mockUseAtomValue.mockReturnValue({
        locale: 'en-US',
      })

      render(<LocaleRow />)

      fireEvent.click(screen.getByLabelText('Reset locale to default'))

      expect(mockSetLocale).toHaveBeenCalledWith('en-US')
    })

    it('resets to empty string when dashboard settings has no locale', () => {
      mockUseAtom.mockReturnValue(['fr-FR', mockSetLocale])
      mockUseAtomValue.mockReturnValue({})

      render(<LocaleRow />)

      fireEvent.click(screen.getByLabelText('Reset locale to default'))

      expect(mockSetLocale).toHaveBeenCalledWith('')
    })

    it('resets to empty string when dashboard settings locale is undefined', () => {
      mockUseAtom.mockReturnValue(['fr-FR', mockSetLocale])
      mockUseAtomValue.mockReturnValue({
        locale: undefined,
      })

      render(<LocaleRow />)

      fireEvent.click(screen.getByLabelText('Reset locale to default'))

      expect(mockSetLocale).toHaveBeenCalledWith('')
    })
  })
})