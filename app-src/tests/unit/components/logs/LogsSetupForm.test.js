/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { LogsSetupForm } from '../../../../src/components/logs/LogsSetupForm'

const mockSetLogsShowLogs = jest.fn()
const mockSetLogsNumberOfLines = jest.fn()
const mockUseAtom = jest.fn()
const mockUseAtomValue = jest.fn()

jest.mock('jotai', () => ({
  useAtom: (...args) => mockUseAtom(...args),
  useAtomValue: (...args) => mockUseAtomValue(...args),
}))

jest.mock('../../../../src/common/store/atoms', () => ({
  logsShowLogsAtom: 'logsShowLogsAtom',
  logsNumberOfLinesAtom: 'logsNumberOfLinesAtom',
}))

describe('LogsSetupForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('initial state', () => {
    it('renders the component', () => {
      mockUseAtom.mockReturnValue([true, mockSetLogsShowLogs])
      mockUseAtom.mockReturnValueOnce([true, mockSetLogsShowLogs]).mockReturnValueOnce([100, mockSetLogsNumberOfLines])

      render(<LogsSetupForm />)

      expect(screen.getByText('Show Logs')).toBeInTheDocument()
    })

    it('renders checkbox checked when showLogs is true', () => {
      mockUseAtom.mockImplementation((atom) => {
        if (atom === 'logsShowLogsAtom') return [true, mockSetLogsShowLogs]
        if (atom === 'logsNumberOfLinesAtom') return [100, mockSetLogsNumberOfLines]
        return [false, jest.fn()]
      })

      render(<LogsSetupForm />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeChecked()
    })

    it('renders checkbox unchecked when showLogs is false', () => {
      mockUseAtom.mockImplementation((atom) => {
        if (atom === 'logsShowLogsAtom') return [false, mockSetLogsShowLogs]
        if (atom === 'logsNumberOfLinesAtom') return [100, mockSetLogsNumberOfLines]
        return [false, jest.fn()]
      })

      render(<LogsSetupForm />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).not.toBeChecked()
    })
  })

  describe('number of lines', () => {
    it('renders number input with value', () => {
      mockUseAtom.mockImplementation((atom) => {
        if (atom === 'logsShowLogsAtom') return [true, mockSetLogsShowLogs]
        if (atom === 'logsNumberOfLinesAtom') return [200, mockSetLogsNumberOfLines]
        return [false, jest.fn()]
      })

      render(<LogsSetupForm />)

      const input = screen.getByRole('spinbutton')
      expect(input).toHaveValue(200)
    })

    it('renders default value of 100', () => {
      mockUseAtom.mockImplementation((atom) => {
        if (atom === 'logsShowLogsAtom') return [true, mockSetLogsShowLogs]
        if (atom === 'logsNumberOfLinesAtom') return [100, mockSetLogsNumberOfLines]
        return [false, jest.fn()]
      })

      render(<LogsSetupForm />)

      const input = screen.getByRole('spinbutton')
      expect(input).toHaveValue(100)
    })
  })

  describe('toggle', () => {
    it('calls setLogsShowLogs when checkbox is toggled', () => {
      mockUseAtom.mockImplementation((atom) => {
        if (atom === 'logsShowLogsAtom') return [true, mockSetLogsShowLogs]
        if (atom === 'logsNumberOfLinesAtom') return [100, mockSetLogsNumberOfLines]
        return [false, jest.fn()]
      })

      render(<LogsSetupForm />)

      const checkbox = screen.getByRole('checkbox')
      checkbox.click()

      expect(mockSetLogsShowLogs).toHaveBeenCalledWith(false)
    })
  })
})
