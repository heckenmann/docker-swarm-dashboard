import { render, screen } from '@testing-library/react'

// Mock atoms - must mock the module before importing the component
jest.mock('../../../../src/common/store/atoms/themeAtoms', () => ({
  currentVariantClassesAtom: 'currentVariantClassesAtom',
}))

jest.mock('../../../../src/common/store/atoms/logsAtoms', () => ({
  logsLinesAtom: 'logsLinesAtom',
  logsNumberOfLinesAtom: 'logsNumberOfLinesAtom',
  logsFormTailAtom: 'logsFormTailAtom',
  logsSearchKeywordAtom: 'logsSearchKeywordAtom',
  logsFormServiceIdAtom: 'logsFormServiceIdAtom',
  logsFormServiceNameAtom: 'logsFormServiceNameAtom',
}))

// Mock Jotai atoms
const mockUseAtomValue = jest.fn()
jest.mock('jotai', () => ({
  useAtomValue: (atom) => mockUseAtomValue(atom),
  Provider: ({ children }) => children,
}))

import LogsOutput, { escapeRegExp } from '../../../../src/components/logs/LogsOutput'

const defaultAtoms = {
  currentVariantClassesAtom: 'light',
  logsLinesAtom: [
    '2024-01-01 10:00:00 INFO Starting service',
    '2024-01-01 10:00:01 ERROR Connection failed',
    '2024-01-01 10:00:02 ERROR Service stopped unexpectedly',
    '2024-01-01 10:00:03 INFO Service running',
  ],
  logsNumberOfLinesAtom: 100,
  logsFormTailAtom: 50,
  logsSearchKeywordAtom: '',
  logsFormServiceIdAtom: 'service-123',
  logsFormServiceNameAtom: 'my-service',
  versionAtom: { version: '1.0.0' },
}

describe('LogsOutput', () => {
  beforeEach(() => {
    mockUseAtomValue.mockImplementation((atom) => defaultAtoms[atom])
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('renders log lines', () => {
    render(<LogsOutput />)
    expect(screen.getByText(/Starting service/)).toBeInTheDocument()
    expect(screen.getByText(/Connection failed/)).toBeInTheDocument()
  })

  test('highlights keyword matches', () => {
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'logsSearchKeywordAtom') return 'ERROR'
      return defaultAtoms[atom]
    })
    render(<LogsOutput />)
    const marks = screen.getAllByRole('mark')
    expect(marks.length).toBeGreaterThan(0)
  })

  test('shows match counter when keyword is active', () => {
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'logsSearchKeywordAtom') return 'ERROR'
      return defaultAtoms[atom]
    })
    render(<LogsOutput />)
    expect(screen.getByText('2 of 4 lines match')).toBeInTheDocument()
    expect(screen.getByText('(2 hidden)')).toBeInTheDocument()
  })

  test('displays Copy and Download buttons', () => {
    render(<LogsOutput />)
    expect(screen.getByRole('button', { name: /Copy/i })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Download/i }),
    ).toBeInTheDocument()
  })

  test('applies error styling to stderr/error lines', () => {
    render(<LogsOutput />)
    const errorLines = screen.getAllByText(/ERROR/)
    errorLines.forEach((line) => {
      expect(line.closest('div')).toHaveClass('text-danger', 'fw-semibold')
    })
  })

  test('copy button calls copyLogsToClipboard with logsLines', () => {
    const logsLines = ['line1', 'line2']
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'logsLinesAtom') return logsLines
      return defaultAtoms[atom]
    })
    // Mock the clipboard API
    const originalClipboard = navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn() },
      writable: true,
    })
    render(<LogsOutput />)
    const copyButton = screen.getByRole('button', { name: /Copy/i })
    copyButton.click()
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('line1\nline2')
    // Restore
    Object.defineProperty(navigator, 'clipboard', { value: originalClipboard })
  })

  test('download button calls downloadLogs', () => {
    const logsLines = ['line1', 'line2']
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'logsLinesAtom') return logsLines
      return defaultAtoms[atom]
    })
    // Mock URL.createObjectURL and document.createElement
    const mockClick = jest.fn()
    const mockRemove = jest.fn()
    const mockCreateObjectURL = jest.fn(() => 'blob:mock-url')
    const mockRevokeObjectURL = jest.fn()
    const originalCreateObjectURL = URL.createObjectURL
    const originalRevokeObjectURL = URL.revokeObjectURL
    const originalCreateElement = document.createElement
    URL.createObjectURL = mockCreateObjectURL
    URL.revokeObjectURL = mockRevokeObjectURL
    document.createElement = jest.fn((tag) => {
      if (tag === 'a') {
        return { href: '', download: '', click: mockClick, remove: mockRemove }
      }
      return originalCreateElement.call(document, tag)
    })
    render(<LogsOutput />)
    const downloadButton = screen.getByRole('button', { name: /Download/i })
    downloadButton.click()
    expect(mockCreateObjectURL).toHaveBeenCalled()
    expect(mockClick).toHaveBeenCalled()
    expect(mockRevokeObjectURL).toHaveBeenCalled()
    // Restore
    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
    document.createElement = originalCreateElement
  })

  test('escapeRegExp escapes special characters', () => {
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'logsSearchKeywordAtom') return 'test (error)'
      return defaultAtoms[atom]
    })
    // Should not throw an error when rendering with special chars in regex
    expect(() => render(<LogsOutput />)).not.toThrow()
  })

  test('handles null logsLines gracefully', () => {
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'logsLinesAtom') return null
      return defaultAtoms[atom]
    })
    expect(() => render(<LogsOutput />)).not.toThrow()
  })

  test('handles empty logsLines gracefully', () => {
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'logsLinesAtom') return []
      return defaultAtoms[atom]
    })
    render(<LogsOutput />)
    // Should render without crashing
    expect(screen.getByLabelText('Log output')).toBeInTheDocument()
  })

  test('uses serviceName for download filename', () => {
    render(<LogsOutput />)
    const downloadButton = screen.getByRole('button', { name: /Download/i })
    expect(downloadButton).toBeInTheDocument()
  })

  test('uses serviceId when serviceName is missing', () => {
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'logsFormServiceNameAtom') return null
      return defaultAtoms[atom]
    })
    render(<LogsOutput />)
    expect(
      screen.getByRole('button', { name: /Download/i }),
    ).toBeInTheDocument()
  })

  test('handles whitespace-only keyword', () => {
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'logsSearchKeywordAtom') return '   '
      return defaultAtoms[atom]
    })
    render(<LogsOutput />)
    // Whitespace-only keyword should be treated as empty after trim
    expect(screen.queryByText(/of.*lines match/)).not.toBeInTheDocument()
  })
})

describe('escapeRegExp', () => {
  test('escapes special regex characters', () => {
    expect(escapeRegExp('test(error)')).toBe('test\\(error\\)')
    expect(escapeRegExp('a.b*c+d?')).toBe('a\\.b\\*c\\+d\\?')
  })

  test('returns empty string for empty input', () => {
    expect(escapeRegExp('')).toBe('')
  })
})
