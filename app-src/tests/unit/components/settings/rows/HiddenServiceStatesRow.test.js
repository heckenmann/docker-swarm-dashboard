/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { HiddenServiceStatesRow } from '../../../../../src/components/settings/rows/HiddenServiceStatesRow'

const mockUseAtomValue = jest.fn()
const mockSetHiddenServiceStates = jest.fn()
const mockUseAtom = jest.fn()

jest.mock('jotai', () => ({
  useAtomValue: (...args) => mockUseAtomValue(...args),
  useAtom: (...args) => mockUseAtom(...args),
}))

jest.mock('../../../../../src/common/store/atoms', () => ({
  hiddenServiceStatesAtom: 'hiddenServiceStatesAtom',
  dashboardSettingsAtom: 'dashboardSettingsAtom',
}))

/**
 * Helper to render a <tr> component inside proper table structure.
 * This avoids HTML nesting warnings in tests.
 */
function renderTableRow(ui) {
  return render(
    <table>
      <tbody>{ui}</tbody>
    </table>,
  )
}

describe('HiddenServiceStatesRow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAtomValue.mockReturnValue({
      hiddenServiceStates: ['failed', 'shutdown'],
    })
    mockUseAtom.mockReturnValue([
      ['failed', 'shutdown'],
      mockSetHiddenServiceStates,
    ])
  })

  describe('initial state', () => {
    it('renders the component with existing hidden states displayed as badges', () => {
      renderTableRow(<HiddenServiceStatesRow />)

      expect(screen.getByText('Hidden service states')).toBeInTheDocument()
      expect(screen.getByLabelText('Hidden state: failed')).toBeInTheDocument()
      expect(
        screen.getByLabelText('Hidden state: shutdown'),
      ).toBeInTheDocument()
    })

    it('renders the dropdown toggle button', () => {
      renderTableRow(<HiddenServiceStatesRow />)

      expect(
        screen.getByRole('button', { name: /add state/i }),
      ).toBeInTheDocument()
    })

    it('renders the custom state input field', () => {
      renderTableRow(<HiddenServiceStatesRow />)

      expect(screen.getByLabelText('Add custom state')).toBeInTheDocument()
    })

    it('renders the reset button', () => {
      renderTableRow(<HiddenServiceStatesRow />)

      expect(
        screen.getByLabelText('Reset hidden service states to default'),
      ).toBeInTheDocument()
    })

    it('renders with empty hidden states array', () => {
      mockUseAtom.mockReturnValue([[], mockSetHiddenServiceStates])

      renderTableRow(<HiddenServiceStatesRow />)

      expect(screen.queryByLabelText(/Hidden state:/)).not.toBeInTheDocument()
    })
  })

  describe('dropdown state selection', () => {
    it('adds a new state when clicking a dropdown item', () => {
      mockUseAtom.mockReturnValue([[], mockSetHiddenServiceStates])
      renderTableRow(<HiddenServiceStatesRow />)

      // Open dropdown
      fireEvent.click(screen.getByRole('button', { name: /add state/i }))

      // Click on 'running' state
      fireEvent.click(screen.getByText('running'))

      expect(mockSetHiddenServiceStates).toHaveBeenCalledWith(['running'])
    })

    it('does not add duplicate state when clicking dropdown item for existing state', () => {
      mockUseAtom.mockReturnValue([['failed'], mockSetHiddenServiceStates])
      renderTableRow(<HiddenServiceStatesRow />)

      // Open dropdown
      fireEvent.click(screen.getByRole('button', { name: /add state/i }))

      // Click on 'failed' state which is already in the list
      // Use getByRole to target the dropdown item specifically (not the badge)
      fireEvent.click(screen.getByRole('button', { name: 'failed' }))

      // Should not call setter since state already exists
      expect(mockSetHiddenServiceStates).not.toHaveBeenCalled()
    })

    it('adds state to existing array when clicking dropdown item', () => {
      mockUseAtom.mockReturnValue([['failed'], mockSetHiddenServiceStates])
      renderTableRow(<HiddenServiceStatesRow />)

      // Open dropdown
      fireEvent.click(screen.getByRole('button', { name: /add state/i }))

      // Click on 'shutdown' state
      fireEvent.click(screen.getByText('shutdown'))

      expect(mockSetHiddenServiceStates).toHaveBeenCalledWith([
        'failed',
        'shutdown',
      ])
    })
  })

  describe('custom state input', () => {
    it('adds custom state when pressing Enter in the input field', () => {
      mockUseAtom.mockReturnValue([[], mockSetHiddenServiceStates])
      renderTableRow(<HiddenServiceStatesRow />)

      const input = screen.getByLabelText('Add custom state')
      fireEvent.change(input, { target: { value: 'custom-state' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(mockSetHiddenServiceStates).toHaveBeenCalledWith(['custom-state'])
    })

    it('trims whitespace and converts to lowercase for custom state', () => {
      mockUseAtom.mockReturnValue([[], mockSetHiddenServiceStates])
      renderTableRow(<HiddenServiceStatesRow />)

      const input = screen.getByLabelText('Add custom state')
      fireEvent.change(input, { target: { value: '  CUSTOM-STATE  ' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(mockSetHiddenServiceStates).toHaveBeenCalledWith(['custom-state'])
    })

    it('does not add empty custom state', () => {
      mockUseAtom.mockReturnValue([[], mockSetHiddenServiceStates])
      renderTableRow(<HiddenServiceStatesRow />)

      const input = screen.getByLabelText('Add custom state')
      fireEvent.change(input, { target: { value: '   ' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(mockSetHiddenServiceStates).not.toHaveBeenCalled()
    })

    it('does not add duplicate custom state', () => {
      mockUseAtom.mockReturnValue([['failed'], mockSetHiddenServiceStates])
      renderTableRow(<HiddenServiceStatesRow />)

      const input = screen.getByLabelText('Add custom state')
      fireEvent.change(input, { target: { value: 'failed' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(mockSetHiddenServiceStates).not.toHaveBeenCalled()
    })

    it('clears input field after adding custom state', () => {
      mockUseAtom.mockReturnValue([[], mockSetHiddenServiceStates])
      renderTableRow(<HiddenServiceStatesRow />)

      const input = screen.getByLabelText('Add custom state')
      fireEvent.change(input, { target: { value: 'custom-state' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(input).toHaveValue('')
    })
  })

  describe('badge removal', () => {
    it('removes state when clicking remove button on badge', () => {
      mockUseAtom.mockReturnValue([
        ['failed', 'shutdown'],
        mockSetHiddenServiceStates,
      ])
      renderTableRow(<HiddenServiceStatesRow />)

      // Click remove button for 'failed' state
      fireEvent.click(screen.getByLabelText('Remove failed'))

      expect(mockSetHiddenServiceStates).toHaveBeenCalledWith(['shutdown'])
    })

    it('removes state from middle of array', () => {
      mockUseAtom.mockReturnValue([
        ['failed', 'shutdown', 'new'],
        mockSetHiddenServiceStates,
      ])
      renderTableRow(<HiddenServiceStatesRow />)

      // Click remove button for 'shutdown' state
      fireEvent.click(screen.getByLabelText('Remove shutdown'))

      expect(mockSetHiddenServiceStates).toHaveBeenCalledWith(['failed', 'new'])
    })

    it('removes only state from array', () => {
      mockUseAtom.mockReturnValue([['failed'], mockSetHiddenServiceStates])
      renderTableRow(<HiddenServiceStatesRow />)

      // Click remove button for 'failed' state
      fireEvent.click(screen.getByLabelText('Remove failed'))

      expect(mockSetHiddenServiceStates).toHaveBeenCalledWith([])
    })
  })

  describe('reset button', () => {
    it('resets hidden states to dashboard settings default', () => {
      mockUseAtom.mockReturnValue([
        ['failed', 'shutdown'],
        mockSetHiddenServiceStates,
      ])
      mockUseAtomValue.mockReturnValue({
        hiddenServiceStates: ['new', 'pending'],
      })

      renderTableRow(<HiddenServiceStatesRow />)

      fireEvent.click(
        screen.getByLabelText('Reset hidden service states to default'),
      )

      expect(mockSetHiddenServiceStates).toHaveBeenCalledWith([
        'new',
        'pending',
      ])
    })

    it('resets to empty array when dashboard settings has no hiddenServiceStates', () => {
      mockUseAtom.mockReturnValue([['failed'], mockSetHiddenServiceStates])
      mockUseAtomValue.mockReturnValue({})

      renderTableRow(<HiddenServiceStatesRow />)

      fireEvent.click(
        screen.getByLabelText('Reset hidden service states to default'),
      )

      expect(mockSetHiddenServiceStates).toHaveBeenCalledWith([])
    })
  })
})
