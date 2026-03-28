/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import CenteredLayoutRow from '../../../../../src/components/settings/rows/CenteredLayoutRow'

const mockSetMaxContentWidth = jest.fn()
const mockUseAtom = jest.fn()
const mockUseAtomValue = jest.fn()

jest.mock('jotai', () => ({
  useAtom: (...args) => mockUseAtom(...args),
  useAtomValue: (...args) => mockUseAtomValue(...args),
}))

jest.mock('../../../../../src/common/store/atoms/uiAtoms', () => ({
  maxContentWidthAtom: 'maxContentWidthAtom',
}))

jest.mock('../../../../../src/common/store/atoms/foundationAtoms', () => ({
  dashboardSettingsAtom: 'dashboardSettingsAtom',
}))

describe('CenteredLayoutRow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('initial state', () => {
    it('renders the component', () => {
      mockUseAtom.mockReturnValue(['centered', mockSetMaxContentWidth])
      mockUseAtomValue.mockReturnValue({ maxContentWidth: 'centered' })

      render(
        <table>
          <tbody>
            <CenteredLayoutRow />
          </tbody>
        </table>
      )

      expect(screen.getByText('Centered layout')).toBeInTheDocument()
    })

    it('renders switch checked when maxContentWidth is centered', () => {
      mockUseAtom.mockReturnValue(['centered', mockSetMaxContentWidth])
      mockUseAtomValue.mockReturnValue({ maxContentWidth: 'centered' })

      render(
        <table>
          <tbody>
            <CenteredLayoutRow />
          </tbody>
        </table>
      )

      const switch_ = screen.getByRole('checkbox')
      expect(switch_).toBeChecked()
    })

    it('renders switch unchecked when maxContentWidth is fluid', () => {
      mockUseAtom.mockReturnValue(['fluid', mockSetMaxContentWidth])
      mockUseAtomValue.mockReturnValue({ maxContentWidth: 'centered' })

      render(
        <table>
          <tbody>
            <CenteredLayoutRow />
          </tbody>
        </table>
      )

      const switch_ = screen.getByRole('checkbox')
      expect(switch_).not.toBeChecked()
    })
  })

  describe('toggle switch', () => {
    it('toggles from centered to fluid', () => {
      mockUseAtom.mockReturnValue(['centered', mockSetMaxContentWidth])
      mockUseAtomValue.mockReturnValue({ maxContentWidth: 'centered' })

      render(
        <table>
          <tbody>
            <CenteredLayoutRow />
          </tbody>
        </table>
      )

      fireEvent.click(screen.getByRole('checkbox'))

      expect(mockSetMaxContentWidth).toHaveBeenCalledWith('fluid')
    })

    it('toggles from fluid to centered', () => {
      mockUseAtom.mockReturnValue(['fluid', mockSetMaxContentWidth])
      mockUseAtomValue.mockReturnValue({ maxContentWidth: 'centered' })

      render(
        <table>
          <tbody>
            <CenteredLayoutRow />
          </tbody>
        </table>
      )

      fireEvent.click(screen.getByRole('checkbox'))

      expect(mockSetMaxContentWidth).toHaveBeenCalledWith('centered')
    })
  })

  describe('reset button', () => {
    it('resets to dashboard settings value (centered)', () => {
      mockUseAtom.mockReturnValue(['fluid', mockSetMaxContentWidth])
      mockUseAtomValue.mockReturnValue({ maxContentWidth: 'centered' })

      render(
        <table>
          <tbody>
            <CenteredLayoutRow />
          </tbody>
        </table>
      )

      fireEvent.click(screen.getByLabelText('Reset centered layout to default'))

      expect(mockSetMaxContentWidth).toHaveBeenCalledWith('centered')
    })

    it('resets to dashboard settings value (fluid)', () => {
      mockUseAtom.mockReturnValue(['centered', mockSetMaxContentWidth])
      mockUseAtomValue.mockReturnValue({ maxContentWidth: 'fluid' })

      render(
        <table>
          <tbody>
            <CenteredLayoutRow />
          </tbody>
        </table>
      )

      fireEvent.click(screen.getByLabelText('Reset centered layout to default'))

      expect(mockSetMaxContentWidth).toHaveBeenCalledWith('fluid')
    })

    it('resets to fluid when dashboard settings has no maxContentWidth', () => {
      mockUseAtom.mockReturnValue(['centered', mockSetMaxContentWidth])
      mockUseAtomValue.mockReturnValue({})

      render(
        <table>
          <tbody>
            <CenteredLayoutRow />
          </tbody>
        </table>
      )

      fireEvent.click(screen.getByLabelText('Reset centered layout to default'))

      expect(mockSetMaxContentWidth).toHaveBeenCalledWith('fluid')
    })
  })
})
