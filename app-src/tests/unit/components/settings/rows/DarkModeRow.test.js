/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import DarkModeRow from '../../../../../src/components/settings/rows/DarkModeRow'

const mockSetIsDarkMode = jest.fn()
const mockUseAtom = jest.fn()
const mockUseAtomValue = jest.fn()

jest.mock('jotai', () => ({
  useAtom: (...args) => mockUseAtom(...args),
  useAtomValue: (...args) => mockUseAtomValue(...args),
}))

jest.mock('../../../../../src/common/store/atoms/themeAtoms', () => ({
  isDarkModeAtom: 'isDarkModeAtom',
}))

jest.mock('../../../../../src/common/store/atoms/foundationAtoms', () => ({
  dashboardSettingsAtom: 'dashboardSettingsAtom',
}))

describe('DarkModeRow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('initial state', () => {
    it('renders the component', () => {
      mockUseAtom.mockReturnValue([false, mockSetIsDarkMode])
      mockUseAtomValue.mockReturnValue({ isDarkMode: true })

      render(
        <table>
          <tbody>
            <DarkModeRow />
          </tbody>
        </table>
      )

      expect(screen.getByText('Dark Mode')).toBeInTheDocument()
    })

    it('renders switch checked when isDarkMode is true', () => {
      mockUseAtom.mockReturnValue([true, mockSetIsDarkMode])
      mockUseAtomValue.mockReturnValue({ isDarkMode: true })

      render(
        <table>
          <tbody>
            <DarkModeRow />
          </tbody>
        </table>
      )

      const switch_ = screen.getByRole('checkbox')
      expect(switch_).toBeChecked()
    })

    it('renders switch unchecked when isDarkMode is false', () => {
      mockUseAtom.mockReturnValue([false, mockSetIsDarkMode])
      mockUseAtomValue.mockReturnValue({ isDarkMode: false })

      render(
        <table>
          <tbody>
            <DarkModeRow />
          </tbody>
        </table>
      )

      const switch_ = screen.getByRole('checkbox')
      expect(switch_).not.toBeChecked()
    })
  })

  describe('toggle switch', () => {
    it('toggles from false to true', () => {
      mockUseAtom.mockReturnValue([false, mockSetIsDarkMode])
      mockUseAtomValue.mockReturnValue({ isDarkMode: true })

      render(
        <table>
          <tbody>
            <DarkModeRow />
          </tbody>
        </table>
      )

      fireEvent.click(screen.getByRole('checkbox'))

      expect(mockSetIsDarkMode).toHaveBeenCalledWith(true)
    })

    it('toggles from true to false', () => {
      mockUseAtom.mockReturnValue([true, mockSetIsDarkMode])
      mockUseAtomValue.mockReturnValue({ isDarkMode: true })

      render(
        <table>
          <tbody>
            <DarkModeRow />
          </tbody>
        </table>
      )

      fireEvent.click(screen.getByRole('checkbox'))

      expect(mockSetIsDarkMode).toHaveBeenCalledWith(false)
    })
  })

  describe('reset button', () => {
    it('resets to dashboard settings value (true)', () => {
      mockUseAtom.mockReturnValue([false, mockSetIsDarkMode])
      mockUseAtomValue.mockReturnValue({ isDarkMode: true })

      render(
        <table>
          <tbody>
            <DarkModeRow />
          </tbody>
        </table>
      )

      fireEvent.click(screen.getByLabelText('Reset dark mode to default'))

      expect(mockSetIsDarkMode).toHaveBeenCalledWith(true)
    })

    it('resets to dashboard settings value (false)', () => {
      mockUseAtom.mockReturnValue([true, mockSetIsDarkMode])
      mockUseAtomValue.mockReturnValue({ isDarkMode: false })

      render(
        <table>
          <tbody>
            <DarkModeRow />
          </tbody>
        </table>
      )

      fireEvent.click(screen.getByLabelText('Reset dark mode to default'))

      expect(mockSetIsDarkMode).toHaveBeenCalledWith(false)
    })

    it('resets to false when dashboard settings has no isDarkMode', () => {
      mockUseAtom.mockReturnValue([true, mockSetIsDarkMode])
      mockUseAtomValue.mockReturnValue({})

      render(
        <table>
          <tbody>
            <DarkModeRow />
          </tbody>
        </table>
      )

      fireEvent.click(screen.getByLabelText('Reset dark mode to default'))

      expect(mockSetIsDarkMode).toHaveBeenCalledWith(false)
    })
  })
})
