/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { ShowNavLabelsRow } from '../../../../../src/components/settings/rows/ShowNavLabelsRow'

const mockSetShowNavLabels = jest.fn()
const mockUseAtom = jest.fn()
const mockUseAtomValue = jest.fn()

jest.mock('jotai', () => ({
  useAtom: (...args) => mockUseAtom(...args),
  useAtomValue: (...args) => mockUseAtomValue(...args),
}))

jest.mock('../../../../../src/common/store/atoms', () => ({
  showNavLabelsAtom: 'showNavLabelsAtom',
  dashboardSettingsAtom: 'dashboardSettingsAtom',
}))

describe('ShowNavLabelsRow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('initial state', () => {
    it('renders the component', () => {
      mockUseAtom.mockReturnValue([false, mockSetShowNavLabels])
      mockUseAtomValue.mockReturnValue({ showNavLabels: true })

      render(
        <table>
          <tbody>
            <ShowNavLabelsRow />
          </tbody>
        </table>
      )

      expect(screen.getByText('Show navigation labels')).toBeInTheDocument()
    })

    it('renders the switch checked when showNavLabels is true', () => {
      mockUseAtom.mockReturnValue([true, mockSetShowNavLabels])
      mockUseAtomValue.mockReturnValue({ showNavLabels: true })

      render(
        <table>
          <tbody>
            <ShowNavLabelsRow />
          </tbody>
        </table>
      )

      const switch_ = screen.getByRole('checkbox')
      expect(switch_).toBeChecked()
    })

    it('renders the switch unchecked when showNavLabels is false', () => {
      mockUseAtom.mockReturnValue([false, mockSetShowNavLabels])
      mockUseAtomValue.mockReturnValue({ showNavLabels: true })

      render(
        <table>
          <tbody>
            <ShowNavLabelsRow />
          </tbody>
        </table>
      )

      const switch_ = screen.getByRole('checkbox')
      expect(switch_).not.toBeChecked()
    })

    it('renders the env variable name', () => {
      mockUseAtom.mockReturnValue([false, mockSetShowNavLabels])
      mockUseAtomValue.mockReturnValue({ showNavLabels: true })

      render(
        <table>
          <tbody>
            <ShowNavLabelsRow />
          </tbody>
        </table>
      )

      expect(screen.getByText('Env: DSD_SHOW_NAV_LABELS')).toBeInTheDocument()
    })

    it('renders the reset button', () => {
      mockUseAtom.mockReturnValue([false, mockSetShowNavLabels])
      mockUseAtomValue.mockReturnValue({ showNavLabels: true })

      render(
        <table>
          <tbody>
            <ShowNavLabelsRow />
          </tbody>
        </table>
      )

      expect(
        screen.getByLabelText('Reset show nav labels to default'),
      ).toBeInTheDocument()
    })
  })

  describe('toggle switch', () => {
    it('calls setShowNavLabels with true when toggled on', () => {
      mockUseAtom.mockReturnValue([false, mockSetShowNavLabels])
      mockUseAtomValue.mockReturnValue({ showNavLabels: true })

      render(
        <table>
          <tbody>
            <ShowNavLabelsRow />
          </tbody>
        </table>
      )

      fireEvent.click(screen.getByRole('checkbox'))

      expect(mockSetShowNavLabels).toHaveBeenCalledWith(true)
    })

    it('calls setShowNavLabels with false when toggled off', () => {
      mockUseAtom.mockReturnValue([true, mockSetShowNavLabels])
      mockUseAtomValue.mockReturnValue({ showNavLabels: true })

      render(
        <table>
          <tbody>
            <ShowNavLabelsRow />
          </tbody>
        </table>
      )

      fireEvent.click(screen.getByRole('checkbox'))

      expect(mockSetShowNavLabels).toHaveBeenCalledWith(false)
    })
  })

  describe('reset button', () => {
    it('resets to dashboard settings showNavLabels value (true)', () => {
      mockUseAtom.mockReturnValue([false, mockSetShowNavLabels])
      mockUseAtomValue.mockReturnValue({ showNavLabels: true })

      render(
        <table>
          <tbody>
            <ShowNavLabelsRow />
          </tbody>
        </table>
      )

      fireEvent.click(screen.getByLabelText('Reset show nav labels to default'))

      expect(mockSetShowNavLabels).toHaveBeenCalledWith(true)
    })

    it('resets to dashboard settings showNavLabels value (false)', () => {
      mockUseAtom.mockReturnValue([true, mockSetShowNavLabels])
      mockUseAtomValue.mockReturnValue({ showNavLabels: false })

      render(
        <table>
          <tbody>
            <ShowNavLabelsRow />
          </tbody>
        </table>
      )

      fireEvent.click(screen.getByLabelText('Reset show nav labels to default'))

      expect(mockSetShowNavLabels).toHaveBeenCalledWith(false)
    })

    it('resets to false when dashboard settings has no showNavLabels', () => {
      mockUseAtom.mockReturnValue([true, mockSetShowNavLabels])
      mockUseAtomValue.mockReturnValue({})

      render(
        <table>
          <tbody>
            <ShowNavLabelsRow />
          </tbody>
        </table>
      )

      fireEvent.click(screen.getByLabelText('Reset show nav labels to default'))

      expect(mockSetShowNavLabels).toHaveBeenCalledWith(false)
    })
  })
})
