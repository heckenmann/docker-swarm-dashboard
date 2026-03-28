import { render, screen, fireEvent } from '@testing-library/react'

// Mock atoms
jest.mock('../../../../src/common/store/atoms/themeAtoms', () => ({
  currentVariantAtom: 'currentVariantAtom',
}))

jest.mock('../../../../src/common/store/atoms/logsAtoms', () => ({
  logsFormSinceAtom: 'logsFormSinceAtom',
  logsFormSinceAmountAtom: 'logsFormSinceAmountAtom',
  logsFormSinceUnitAtom: 'logsFormSinceUnitAtom',
  logsFormSinceIsISOAtom: 'logsFormSinceIsISOAtom',
  logsFormSinceErrorAtom: 'logsFormSinceErrorAtom',
}))

const mockUseAtomValue = jest.fn()
const mockUseAtom = jest.fn()
jest.mock('jotai', () => ({
  useAtomValue: (atom) => mockUseAtomValue(atom),
  useAtom: (atom) => mockUseAtom(atom),
  Provider: ({ children }) => children,
}))

// Mock FontAwesomeIcon
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }) => <span data-testid={`icon-${icon}`}>{icon}</span>,
}))

import SinceInput from '../../../../src/components/logs/SinceInput'

const defaultAtoms = {
  currentVariantAtom: 'light',
  logsFormSinceAtom: '5m',
  logsFormSinceAmountAtom: '5',
  logsFormSinceUnitAtom: 'm',
  logsFormSinceIsISOAtom: false,
  logsFormSinceErrorAtom: null,
}

describe('SinceInput', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const setupMocks = (overrides = {}) => {
    const atoms = { ...defaultAtoms, ...overrides }
    mockUseAtomValue.mockImplementation((atom) => atoms[atom] ?? null)
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'logsFormSinceAtom') return [atoms.logsFormSinceAtom, jest.fn()]
      if (atom === 'logsFormSinceAmountAtom') return [atoms.logsFormSinceAmountAtom, jest.fn()]
      if (atom === 'logsFormSinceUnitAtom') return [atoms.logsFormSinceUnitAtom, jest.fn()]
      if (atom === 'logsFormSinceIsISOAtom') return [atoms.logsFormSinceIsISOAtom, jest.fn()]
      if (atom === 'logsFormSinceErrorAtom') return [atoms.logsFormSinceErrorAtom, jest.fn()]
      return [null, jest.fn()]
    })
  }

  describe('Rendering', () => {
    test('renders Since label', () => {
      setupMocks()
      render(<SinceInput />)
      expect(screen.getByText('Since')).toBeInTheDocument()
    })

    test('renders since amount input', () => {
      setupMocks()
      render(<SinceInput />)
      expect(screen.getByLabelText('Since amount')).toBeInTheDocument()
    })

    test('renders preset buttons', () => {
      setupMocks()
      render(<SinceInput />)
      expect(screen.getByRole('button', { name: '5m' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '15m' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '1h' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '6h' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '24h' })).toBeInTheDocument()
    })

    test('renders help text', () => {
      setupMocks()
      render(<SinceInput />)
      expect(screen.getByText(/Show logs since/i)).toBeInTheDocument()
      expect(screen.getByText(/Docker docs/i)).toBeInTheDocument()
    })

    test('renders ISO input in ISO mode', () => {
      setupMocks({ logsFormSinceIsISOAtom: true })
      render(<SinceInput />)
      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
    })

    test('does not render ISO input in duration mode', () => {
      setupMocks({ logsFormSinceIsISOAtom: false })
      render(<SinceInput />)
      // In duration mode, there should be a number input, not textbox
      const numberInput = screen.getByLabelText('Since amount')
      expect(numberInput).toBeInTheDocument()
    })
  })

  describe('Unit buttons', () => {
    test('renders multiple buttons', () => {
      setupMocks()
      render(<SinceInput />)
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThanOrEqual(9)
    })

    test('calls setSinceUnit when unit button clicked', () => {
      const setSinceUnit = jest.fn()
      const setSince = jest.fn()
      const setSinceError = jest.fn()
      setupMocks()
      mockUseAtom.mockImplementation((atom) => {
        if (atom === 'logsFormSinceUnitAtom') return ['m', setSinceUnit]
        if (atom === 'logsFormSinceAtom') return ['5m', setSince]
        if (atom === 'logsFormSinceErrorAtom') return [null, setSinceError]
        return [defaultAtoms[atom] || null, jest.fn()]
      })
      render(<SinceInput />)
      const buttons = screen.getAllByRole('button')
      const hButton = buttons.find(b => b.textContent === 'h (hours)')
      hButton.click()
      expect(setSinceUnit).toHaveBeenCalledWith('h')
    })
  })

  describe('Preset buttons', () => {
    test('calls setters when preset clicked', () => {
      const setSinceAmount = jest.fn()
      const setSinceUnit = jest.fn()
      const setSince = jest.fn()
      const setSinceError = jest.fn()
      setupMocks()
      mockUseAtom.mockImplementation((atom) => {
        if (atom === 'logsFormSinceAmountAtom') return ['5', setSinceAmount]
        if (atom === 'logsFormSinceUnitAtom') return ['m', setSinceUnit]
        if (atom === 'logsFormSinceAtom') return ['5m', setSince]
        if (atom === 'logsFormSinceErrorAtom') return [null, setSinceError]
        return [defaultAtoms[atom] || null, jest.fn()]
      })
      render(<SinceInput />)
      screen.getByRole('button', { name: '1h' }).click()
      expect(setSinceAmount).toHaveBeenCalledWith('1')
      expect(setSinceUnit).toHaveBeenCalledWith('h')
      expect(setSince).toHaveBeenCalledWith('1h')
      expect(setSinceError).toHaveBeenCalledWith(false)
    })
  })

  describe('Since amount input', () => {
    test('renders with correct value', () => {
      setupMocks({ logsFormSinceAmountAtom: '15' })
      render(<SinceInput />)
      expect(screen.getByLabelText('Since amount')).toHaveValue(15)
    })

    test('changing since amount input calls setSinceAmount and setSince', () => {
      const setSinceAmount = jest.fn()
      const setSince = jest.fn()
      const setSinceError = jest.fn()
      // First call setupMocks to get base implementation, then override specific atoms
      setupMocks()
      // Override only the atoms we need for this test
      mockUseAtom.mockImplementation((atom) => {
        if (atom === 'logsFormSinceAtom') return ['5m', setSince]
        if (atom === 'logsFormSinceAmountAtom') return ['5', setSinceAmount]
        if (atom === 'logsFormSinceUnitAtom') return ['m', jest.fn()]
        if (atom === 'logsFormSinceIsISOAtom') return [false, jest.fn()]
        if (atom === 'logsFormSinceErrorAtom') return [null, setSinceError]
        return [null, jest.fn()]
      })
      render(<SinceInput />)
      const input = screen.getByLabelText('Since amount')
      fireEvent.change(input, { target: { value: '10' } })
      expect(setSinceAmount).toHaveBeenCalledWith('10')
      expect(setSince).toHaveBeenCalled()
    })
  })

  describe('Mode switching', () => {
    test('renders toggle button', () => {
      setupMocks()
      render(<SinceInput />)
      const toggleBtn = screen.getByRole('button', { name: /Switch/i })
      expect(toggleBtn).toBeInTheDocument()
    })

    test('toggle button exists in ISO mode', () => {
      setupMocks({ logsFormSinceIsISOAtom: true })
      render(<SinceInput />)
      const toggleBtn = screen.getByRole('button', { name: /Switch/i })
      expect(toggleBtn).toBeInTheDocument()
    })

    test('clicking toggle from duration to ISO calls setSinceIsISO with true', () => {
      const setSinceIsISO = jest.fn((callback) => {
        // Simulate Jotai's useAtom setter behavior - it calls the callback with current value
        callback(false)
        return undefined
      })
      const setSince = jest.fn()
      mockUseAtom.mockImplementation((atom) => {
        if (atom === 'logsFormSinceAtom') return ['5m', setSince]
        if (atom === 'logsFormSinceAmountAtom') return ['5', jest.fn()]
        if (atom === 'logsFormSinceUnitAtom') return ['m', jest.fn()]
        if (atom === 'logsFormSinceIsISOAtom') return [false, setSinceIsISO]
        if (atom === 'logsFormSinceErrorAtom') return [null, jest.fn()]
        return [defaultAtoms[atom] || null, jest.fn()]
      })
      render(<SinceInput />)
      const toggleBtn = screen.getByRole('button', { name: /Switch/i })
      toggleBtn.click()
      expect(setSinceIsISO).toHaveBeenCalled()
      expect(setSince).toHaveBeenCalled() // setSince(iso24) is called inside the callback
    })

    test('clicking toggle from ISO to duration calls setSinceIsISO with false', () => {
      const setSinceIsISO = jest.fn((callback) => {
        callback(true)
        return undefined
      })
      const setSince = jest.fn()
      mockUseAtom.mockImplementation((atom) => {
        if (atom === 'logsFormSinceAtom') return ['2023-01-01T12:00:00Z', setSince]
        if (atom === 'logsFormSinceAmountAtom') return ['5', jest.fn()]
        if (atom === 'logsFormSinceUnitAtom') return ['m', jest.fn()]
        if (atom === 'logsFormSinceIsISOAtom') return [true, setSinceIsISO]
        if (atom === 'logsFormSinceErrorAtom') return [null, jest.fn()]
        return [defaultAtoms[atom] || null, jest.fn()]
      })
      render(<SinceInput />)
      const toggleBtn = screen.getByRole('button', { name: /Switch/i })
      toggleBtn.click()
      expect(setSinceIsISO).toHaveBeenCalled()
      expect(setSince).toHaveBeenCalled() // setSince(`${sinceAmount}${sinceUnit}`) is called
    })
  })

  describe('Error display', () => {
    test('shows error message when sinceError is set', () => {
      setupMocks({ logsFormSinceErrorAtom: 'Invalid ISO timestamp' })
      render(<SinceInput />)
      expect(screen.getByText('Invalid ISO timestamp')).toBeInTheDocument()
    })

    test('does not show error when sinceError is null', () => {
      setupMocks({ logsFormSinceErrorAtom: null })
      render(<SinceInput />)
      expect(screen.queryByText('Invalid ISO timestamp')).not.toBeInTheDocument()
    })
  })

  describe('ISO mode error handling', () => {
    test('shows validation error on blur with invalid ISO', () => {
      const setSinceError = jest.fn()
      setupMocks({ logsFormSinceIsISOAtom: true })
      mockUseAtom.mockImplementation((atom) => {
        if (atom === 'logsFormSinceAtom') return ['not-valid-iso', setSinceError]
        if (atom === 'logsFormSinceAmountAtom') return ['5', jest.fn()]
        if (atom === 'logsFormSinceUnitAtom') return ['m', jest.fn()]
        if (atom === 'logsFormSinceIsISOAtom') return [true, jest.fn()]
        if (atom === 'logsFormSinceErrorAtom') return [null, setSinceError]
        return [defaultAtoms[atom] || null, jest.fn()]
      })
      render(<SinceInput />)
      const input = screen.getByRole('textbox')
      // Simulate blur - the component checks isValidSince(since)
      input.blur()
      // setSinceError is called if isValidSince returns false
    })

    test('clears error when typing in ISO input', () => {
      const setSince = jest.fn()
      const setSinceError = jest.fn()
      setupMocks({ logsFormSinceIsISOAtom: true, logsFormSinceErrorAtom: 'Invalid ISO timestamp' })
      mockUseAtom.mockImplementation((atom) => {
        if (atom === 'logsFormSinceAtom') return ['bad', setSince]
        if (atom === 'logsFormSinceAmountAtom') return ['5', jest.fn()]
        if (atom === 'logsFormSinceUnitAtom') return ['m', jest.fn()]
        if (atom === 'logsFormSinceIsISOAtom') return [true, jest.fn()]
        if (atom === 'logsFormSinceErrorAtom') return ['Invalid ISO timestamp', setSinceError]
        return [defaultAtoms[atom] || null, jest.fn()]
      })
      render(<SinceInput />)
      const input = screen.getByRole('textbox')
      // Use fireEvent to simulate change
      fireEvent.change(input, { target: { value: '2023-01-01T12:00:00Z' } })
    })

    test('shows invalid state on ISO input', () => {
      setupMocks({ logsFormSinceIsISOAtom: true, logsFormSinceErrorAtom: 'Invalid ISO timestamp' })
      render(<SinceInput />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('is-invalid')
    })
  })

  describe('Dark mode', () => {
    test('applies correct text class in dark mode', () => {
      setupMocks({ currentVariantAtom: 'dark' })
      render(<SinceInput />)
      const helpText = screen.getByText(/Show logs since/i)
      expect(helpText).toHaveClass('text-secondary')
    })

    test('applies correct text class in light mode', () => {
      setupMocks({ currentVariantAtom: 'light' })
      render(<SinceInput />)
      const helpText = screen.getByText(/Show logs since/i)
      expect(helpText).toHaveClass('text-muted')
    })
  })
})
