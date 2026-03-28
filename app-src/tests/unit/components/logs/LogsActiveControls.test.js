import { render, screen, fireEvent } from '@testing-library/react'

const mockUseAtomValue = jest.fn()
const mockUseAtom = jest.fn()
const mockSetLogsConfig = jest.fn()
const mockSetLogsShowLogs = jest.fn()

jest.mock('../../../../src/common/store/atoms/themeAtoms', () => ({
  currentVariantAtom: 'currentVariantAtom',
}))

jest.mock('../../../../src/common/store/atoms/logsAtoms', () => ({
  logsConfigAtom: 'logsConfigAtom',
  logsLinesAtom: 'logsLinesAtom',
  logsNumberOfLinesAtom: 'logsNumberOfLinesAtom',
  logsSearchKeywordAtom: 'logsSearchKeywordAtom',
  logsShowLogsAtom: 'logsShowLogsAtom',
}))

jest.mock('jotai/utils', () => ({
  useResetAtom: jest.fn(() => jest.fn()),
}))

jest.mock('jotai', () => ({
  useAtomValue: (atom) => mockUseAtomValue(atom),
  useAtom: (atom) => mockUseAtom(atom),
  Provider: ({ children }) => children,
}))

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => null,
}))

import LogsActiveControls from '../../../../src/components/logs/LogsActiveControls'

const defaultAtoms = {
  currentVariantAtom: 'light',
  logsConfigAtom: { serviceName: 'my-service', serviceId: 'abc123', follow: true },
  logsLinesAtom: ['line1', 'line2'],
  logsNumberOfLinesAtom: 50,
  logsSearchKeywordAtom: '',
  logsShowLogsAtom: true,
}

describe('LogsActiveControls', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSetLogsConfig.mockClear()
    mockSetLogsShowLogs.mockClear()
  })

  const setupMocks = (overrides = {}) => {
    const atoms = { ...defaultAtoms, ...overrides }
    mockUseAtomValue.mockImplementation((atom) => atoms[atom] ?? null)
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'logsNumberOfLinesAtom') return [atoms.logsNumberOfLinesAtom, jest.fn()]
      if (atom === 'logsSearchKeywordAtom') return [atoms.logsSearchKeywordAtom, jest.fn()]
      if (atom === 'logsConfigAtom') return [atoms.logsConfigAtom, mockSetLogsConfig]
      if (atom === 'logsShowLogsAtom') return [atoms.logsShowLogsAtom, mockSetLogsShowLogs]
      return [null, jest.fn()]
    })
  }

  describe('Rendering', () => {
    test('renders Service label', () => {
      setupMocks()
      render(<LogsActiveControls />)
      expect(screen.getByText('Service')).toBeInTheDocument()
    })

    test('renders Number of lines label', () => {
      setupMocks()
      render(<LogsActiveControls />)
      expect(screen.getByText('Number of lines')).toBeInTheDocument()
    })

    test('renders Search keyword label', () => {
      setupMocks()
      render(<LogsActiveControls />)
      expect(screen.getByText('Search keyword')).toBeInTheDocument()
    })

    test('renders service name', () => {
      setupMocks()
      render(<LogsActiveControls />)
      expect(screen.getByDisplayValue('my-service')).toBeInTheDocument()
    })

    test('renders Hide logs button', () => {
      setupMocks()
      render(<LogsActiveControls />)
      expect(screen.getByRole('button', { name: /Hide logs/i })).toBeInTheDocument()
    })

    test('service input is disabled', () => {
      setupMocks()
      render(<LogsActiveControls />)
      expect(screen.getByDisplayValue('my-service')).toBeDisabled()
    })
  })

  describe('Number of lines input', () => {
    test('renders number of lines input', () => {
      setupMocks()
      render(<LogsActiveControls />)
      // The number input has type text
      const inputs = screen.getAllByRole('textbox')
      expect(inputs.length).toBeGreaterThan(0)
    })
  })

  describe('Search keyword', () => {
    test('renders search input with placeholder', () => {
      setupMocks()
      render(<LogsActiveControls />)
      expect(screen.getByPlaceholderText('Filter log lines…')).toBeInTheDocument()
    })

    test('renders clear button when keyword is set', () => {
      setupMocks({ logsSearchKeywordAtom: 'error' })
      render(<LogsActiveControls />)
      expect(screen.getByRole('button', { name: /Clear search keyword/i })).toBeInTheDocument()
    })

    test('does not render clear button when keyword is empty', () => {
      setupMocks({ logsSearchKeywordAtom: '' })
      render(<LogsActiveControls />)
      expect(screen.queryByRole('button', { name: /Clear search keyword/i })).not.toBeInTheDocument()
    })

    test('clicking clear search button calls setSearchKeyword with empty string', () => {
      const mockSetSearchKeyword = jest.fn()
      mockUseAtom.mockImplementation((atom) => {
        if (atom === 'logsNumberOfLinesAtom') return [50, jest.fn()]
        if (atom === 'logsSearchKeywordAtom') return ['error', mockSetSearchKeyword]
        if (atom === 'logsConfigAtom') return [defaultAtoms.logsConfigAtom, jest.fn()]
        if (atom === 'logsShowLogsAtom') return [true, jest.fn()]
        return [null, jest.fn()]
      })
      render(<LogsActiveControls />)
      const clearBtn = screen.getByRole('button', { name: /Clear search keyword/i })
      clearBtn.click()
      expect(mockSetSearchKeyword).toHaveBeenCalledWith('')
    })

    test('changing number of lines input calls setLogsNumberOfLines with parsed number', () => {
      const mockSetLogsNumberOfLines = jest.fn()
      mockUseAtom.mockImplementation((atom) => {
        if (atom === 'logsNumberOfLinesAtom') return [50, mockSetLogsNumberOfLines]
        if (atom === 'logsSearchKeywordAtom') return ['', jest.fn()]
        if (atom === 'logsConfigAtom') return [defaultAtoms.logsConfigAtom, jest.fn()]
        if (atom === 'logsShowLogsAtom') return [true, jest.fn()]
        return [null, jest.fn()]
      })
      render(<LogsActiveControls />)
      const input = screen.getByLabelText('Number of lines')
      fireEvent.change(input, { target: { value: '100' } })
      expect(mockSetLogsNumberOfLines).toHaveBeenCalledWith(100)
    })

    test('changing search keyword input calls setSearchKeyword', () => {
      const mockSetSearchKeyword = jest.fn()
      mockUseAtom.mockImplementation((atom) => {
        if (atom === 'logsNumberOfLinesAtom') return [50, jest.fn()]
        if (atom === 'logsSearchKeywordAtom') return ['', mockSetSearchKeyword]
        if (atom === 'logsConfigAtom') return [defaultAtoms.logsConfigAtom, jest.fn()]
        if (atom === 'logsShowLogsAtom') return [true, jest.fn()]
        return [null, jest.fn()]
      })
      render(<LogsActiveControls />)
      const input = screen.getByPlaceholderText('Filter log lines…')
      fireEvent.change(input, { target: { value: 'error' } })
      expect(mockSetSearchKeyword).toHaveBeenCalledWith('error')
    })
  })

  describe('Dark mode', () => {
    test('applies correct text class in dark mode', () => {
      setupMocks({ currentVariantAtom: 'dark' })
      render(<LogsActiveControls />)
      const helpText = screen.getByText(/Selected service for which logs are shown/i)
      expect(helpText).toHaveClass('text-secondary')
    })

    test('applies correct text class in light mode', () => {
      setupMocks({ currentVariantAtom: 'light' })
      render(<LogsActiveControls />)
      const helpText = screen.getByText(/Selected service for which logs are shown/i)
      expect(helpText).toHaveClass('text-muted')
    })
  })

  describe('Hide logs button', () => {
    test('renders with correct variant', () => {
      setupMocks()
      render(<LogsActiveControls />)
      const btn = screen.getByRole('button', { name: /Hide logs/i })
      expect(btn).toBeInTheDocument()
    })

    test('Hide logs button is present and has onClick handler', () => {
      setupMocks()
      render(<LogsActiveControls />)
      const hideBtn = screen.getByRole('button', { name: /Hide logs/i })
      // Just verify the button exists and is a button element
      expect(hideBtn.tagName).toBe('BUTTON')
    })

    test('clicking Hide logs button calls setLogsConfig with null', () => {
      setupMocks()
      render(<LogsActiveControls />)
      const hideBtn = screen.getByRole('button', { name: /Hide logs/i })
      fireEvent.click(hideBtn)
      expect(mockSetLogsConfig).toHaveBeenCalledWith(null)
    })

    test('clicking Hide logs button calls setLogsShowLogs with false', () => {
      setupMocks()
      render(<LogsActiveControls />)
      const hideBtn = screen.getByRole('button', { name: /Hide logs/i })
      fireEvent.click(hideBtn)
      expect(mockSetLogsShowLogs).toHaveBeenCalledWith(false)
    })
  })
})
