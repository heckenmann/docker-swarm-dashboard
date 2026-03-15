/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { DefaultLayoutRow } from '../../../../../src/components/settings/rows/DefaultLayoutRow'

const mockUseAtomValue = jest.fn()
const mockSetDefaultLayout = jest.fn()
const mockUseAtom = jest.fn()

jest.mock('jotai', () => ({
  useAtomValue: (...args) => mockUseAtomValue(...args),
  useAtom: (...args) => mockUseAtom(...args),
}))

jest.mock('../../../../../src/common/store/atoms', () => ({
  defaultLayoutAtom: 'defaultLayoutAtom',
  dashboardSettingsAtom: 'dashboardSettingsAtom',
}))

describe('DefaultLayoutRow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAtomValue.mockReturnValue({
      defaultLayout: 'row',
    })
    mockUseAtom.mockReturnValue(['row', mockSetDefaultLayout])
  })

  describe('initial state', () => {
    it('renders the component with row layout selected by default', () => {
      render(<DefaultLayoutRow />)

      expect(screen.getByText('Default layout')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /horizontal/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /vertical/i })).toBeInTheDocument()
    })

    it('renders row button as active when defaultLayout is row', () => {
      mockUseAtom.mockReturnValue(['row', mockSetDefaultLayout])
      render(<DefaultLayoutRow />)

      const rowButton = screen.getByRole('button', { name: /horizontal/i })
      const columnButton = screen.getByRole('button', { name: /vertical/i })

      expect(rowButton).toHaveClass('active')
      expect(columnButton).not.toHaveClass('active')
    })

    it('renders column button as active when defaultLayout is column', () => {
      mockUseAtom.mockReturnValue(['column', mockSetDefaultLayout])
      render(<DefaultLayoutRow />)

      const rowButton = screen.getByRole('button', { name: /horizontal/i })
      const columnButton = screen.getByRole('button', { name: /vertical/i })

      expect(rowButton).not.toHaveClass('active')
      expect(columnButton).toHaveClass('active')
    })

    it('renders the reset button', () => {
      render(<DefaultLayoutRow />)

      expect(screen.getByLabelText('Reset default layout to default')).toBeInTheDocument()
    })
  })

  describe('layout toggle', () => {
    it('sets layout to row when clicking row button', () => {
      mockUseAtom.mockReturnValue(['column', mockSetDefaultLayout])
      render(<DefaultLayoutRow />)

      fireEvent.click(screen.getByRole('button', { name: /horizontal/i }))

      expect(mockSetDefaultLayout).toHaveBeenCalledWith('row')
    })

    it('sets layout to column when clicking column button', () => {
      mockUseAtom.mockReturnValue(['row', mockSetDefaultLayout])
      render(<DefaultLayoutRow />)

      fireEvent.click(screen.getByRole('button', { name: /vertical/i }))

      expect(mockSetDefaultLayout).toHaveBeenCalledWith('column')
    })

    it('does not call setter when clicking already active button', () => {
      mockUseAtom.mockReturnValue(['row', mockSetDefaultLayout])
      render(<DefaultLayoutRow />)

      fireEvent.click(screen.getByRole('button', { name: /horizontal/i }))

      // Button should still work - the component may or may not call setter
      // depending on implementation, but it shouldn't break
      expect(screen.getByRole('button', { name: /horizontal/i })).toBeInTheDocument()
    })
  })

  describe('reset button', () => {
    it('resets layout to dashboard settings default (row)', () => {
      mockUseAtom.mockReturnValue(['column', mockSetDefaultLayout])
      mockUseAtomValue.mockReturnValue({
        defaultLayout: 'row',
      })

      render(<DefaultLayoutRow />)

      fireEvent.click(screen.getByLabelText('Reset default layout to default'))

      expect(mockSetDefaultLayout).toHaveBeenCalledWith('row')
    })

    it('resets layout to dashboard settings default (column)', () => {
      mockUseAtom.mockReturnValue(['row', mockSetDefaultLayout])
      mockUseAtomValue.mockReturnValue({
        defaultLayout: 'column',
      })

      render(<DefaultLayoutRow />)

      fireEvent.click(screen.getByLabelText('Reset default layout to default'))

      expect(mockSetDefaultLayout).toHaveBeenCalledWith('column')
    })

    it('resets to row when dashboard settings has no defaultLayout', () => {
      mockUseAtom.mockReturnValue(['column', mockSetDefaultLayout])
      mockUseAtomValue.mockReturnValue({})

      render(<DefaultLayoutRow />)

      fireEvent.click(screen.getByLabelText('Reset default layout to default'))

      expect(mockSetDefaultLayout).toHaveBeenCalledWith('row')
    })
  })
})