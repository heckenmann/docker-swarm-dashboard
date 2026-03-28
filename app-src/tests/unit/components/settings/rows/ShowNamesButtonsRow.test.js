/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import ShowNamesButtonsRow from '../../../../../src/components/settings/rows/ShowNamesButtonsRow'

const mockSetShowNamesButtons = jest.fn()
const mockUseAtom = jest.fn()
const mockUseAtomValue = jest.fn()

jest.mock('jotai', () => ({
  useAtom: (...args) => mockUseAtom(...args),
  useAtomValue: (...args) => mockUseAtomValue(...args),
}))

jest.mock('../../../../../src/common/store/atoms/uiAtoms', () => ({
  showNamesButtonsAtom: 'showNamesButtonsAtom',
}))

jest.mock('../../../../../src/common/store/atoms/foundationAtoms', () => ({
  dashboardSettingsAtom: 'dashboardSettingsAtom',
}))

describe('ShowNamesButtonsRow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('initial state', () => {
    it('renders the component', () => {
      mockUseAtom.mockReturnValue([true, mockSetShowNamesButtons])
      mockUseAtomValue.mockReturnValue({ showNamesButtons: true })

      render(
        <table>
          <tbody>
            <ShowNamesButtonsRow />
          </tbody>
        </table>
      )

      expect(screen.getByText('Show buttons in Names')).toBeInTheDocument()
    })

    it('renders switch checked when showNamesButtons is true', () => {
      mockUseAtom.mockReturnValue([true, mockSetShowNamesButtons])
      mockUseAtomValue.mockReturnValue({ showNamesButtons: true })

      render(
        <table>
          <tbody>
            <ShowNamesButtonsRow />
          </tbody>
        </table>
      )

      const switch_ = screen.getByRole('checkbox')
      expect(switch_).toBeChecked()
    })

    it('renders switch unchecked when showNamesButtons is false', () => {
      mockUseAtom.mockReturnValue([false, mockSetShowNamesButtons])
      mockUseAtomValue.mockReturnValue({ showNamesButtons: false })

      render(
        <table>
          <tbody>
            <ShowNamesButtonsRow />
          </tbody>
        </table>
      )

      const switch_ = screen.getByRole('checkbox')
      expect(switch_).not.toBeChecked()
    })
  })

  describe('toggle switch', () => {
    it('toggles from true to false', () => {
      mockUseAtom.mockReturnValue([true, mockSetShowNamesButtons])
      mockUseAtomValue.mockReturnValue({ showNamesButtons: true })

      render(
        <table>
          <tbody>
            <ShowNamesButtonsRow />
          </tbody>
        </table>
      )

      fireEvent.click(screen.getByRole('checkbox'))

      expect(mockSetShowNamesButtons).toHaveBeenCalledWith(false)
    })

    it('toggles from false to true', () => {
      mockUseAtom.mockReturnValue([false, mockSetShowNamesButtons])
      mockUseAtomValue.mockReturnValue({ showNamesButtons: true })

      render(
        <table>
          <tbody>
            <ShowNamesButtonsRow />
          </tbody>
        </table>
      )

      fireEvent.click(screen.getByRole('checkbox'))

      expect(mockSetShowNamesButtons).toHaveBeenCalledWith(true)
    })
  })

  describe('reset button', () => {
    it('resets to dashboard settings value (true)', () => {
      mockUseAtom.mockReturnValue([false, mockSetShowNamesButtons])
      mockUseAtomValue.mockReturnValue({ showNamesButtons: true })

      render(
        <table>
          <tbody>
            <ShowNamesButtonsRow />
          </tbody>
        </table>
      )

      fireEvent.click(
        screen.getByLabelText('Reset show names buttons to default'),
      )

      expect(mockSetShowNamesButtons).toHaveBeenCalledWith(true)
    })

    it('resets to dashboard settings value (false)', () => {
      mockUseAtom.mockReturnValue([true, mockSetShowNamesButtons])
      mockUseAtomValue.mockReturnValue({ showNamesButtons: false })

      render(
        <table>
          <tbody>
            <ShowNamesButtonsRow />
          </tbody>
        </table>
      )

      fireEvent.click(
        screen.getByLabelText('Reset show names buttons to default'),
      )

      expect(mockSetShowNamesButtons).toHaveBeenCalledWith(false)
    })

    it('resets to true when dashboard settings has no showNamesButtons', () => {
      mockUseAtom.mockReturnValue([false, mockSetShowNamesButtons])
      mockUseAtomValue.mockReturnValue({})

      render(
        <table>
          <tbody>
            <ShowNamesButtonsRow />
          </tbody>
        </table>
      )

      fireEvent.click(
        screen.getByLabelText('Reset show names buttons to default'),
      )

      expect(mockSetShowNamesButtons).toHaveBeenCalledWith(true)
    })
  })
})
