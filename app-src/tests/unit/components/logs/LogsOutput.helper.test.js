// LogsOutput.helper.test.js
// Unit tests for extracted helper functions from LogsOutput

// Mock clipboard API
const mockClipboardWriteText = jest.fn()
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: mockClipboardWriteText },
  writable: true,
})

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = jest.fn(() => 'blob:mock-url')
const mockRevokeObjectURL = jest.fn()
Object.defineProperty(URL, 'createObjectURL', {
  value: mockCreateObjectURL,
  writable: true,
})
Object.defineProperty(URL, 'revokeObjectURL', {
  value: mockRevokeObjectURL,
  writable: true,
})

// Mock document.createElement
const mockClick = jest.fn()
const mockRemove = jest.fn()
const mockAppendChild = jest.fn()
Object.defineProperty(document, 'createElement', {
  value: jest.fn((tag) => {
    if (tag === 'a') {
      return {
        href: '',
        download: '',
        click: mockClick,
        remove: mockRemove,
        appendChild: mockAppendChild,
      }
    }
    return {}
  }),
  writable: true,
})

// Now import the functions
const {
  escapeRegExp,
  copyLogsToClipboard,
  downloadLogs,
} = require('../../../../src/components/logs/LogsOutput')

describe('LogsOutput helper functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('escapeRegExp', () => {
    test('escapes parentheses', () => {
      expect(escapeRegExp('test(error)')).toBe('test\\(error\\)')
    })

    test('escapes brackets', () => {
      expect(escapeRegExp('array[0]')).toBe('array\\[0\\]')
    })

    test('escapes curly braces', () => {
      expect(escapeRegExp('a{b}c')).toBe('a\\{b\\}c')
    })

    test('escapes special regex characters', () => {
      expect(escapeRegExp('.*+?^${}()|[]\\')).toBe(
        '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\'
      )
    })

    test('returns empty string for empty input', () => {
      expect(escapeRegExp('')).toBe('')
    })

    test('handles plain text without special chars', () => {
      expect(escapeRegExp('hello world')).toBe('hello world')
    })
  })

  describe('copyLogsToClipboard', () => {
    test('copies logs array as newline-separated string', () => {
      const logs = ['line1', 'line2', 'line3']
      copyLogsToClipboard(logs)
      expect(mockClipboardWriteText).toHaveBeenCalledWith('line1\nline2\nline3')
    })

    test('handles single log line', () => {
      copyLogsToClipboard(['single line'])
      expect(mockClipboardWriteText).toHaveBeenCalledWith('single line')
    })

    test('handles null logs', () => {
      copyLogsToClipboard(null)
      expect(mockClipboardWriteText).toHaveBeenCalledWith('')
    })

    test('handles undefined logs', () => {
      copyLogsToClipboard(undefined)
      expect(mockClipboardWriteText).toHaveBeenCalledWith('')
    })

    test('handles empty array', () => {
      copyLogsToClipboard([])
      expect(mockClipboardWriteText).toHaveBeenCalledWith('')
    })

    test('handles logs with empty strings', () => {
      copyLogsToClipboard(['', 'line2', ''])
      expect(mockClipboardWriteText).toHaveBeenCalledWith('\nline2\n')
    })
  })

  describe('downloadLogs', () => {
    let createElementCalls

    beforeEach(() => {
      jest.clearAllMocks()
      // Re-setup the mock to track calls
      createElementCalls = []
      document.createElement.mockImplementation((tag) => {
        if (tag === 'a') {
          const result = {
            href: '',
            download: '',
            click: mockClick,
            remove: mockRemove,
            appendChild: mockAppendChild,
          }
          createElementCalls.push(result)
          return result
        }
        return {}
      })
    })

    test('creates blob URL and triggers download with service name', () => {
      const logs = ['line1', 'line2']
      downloadLogs(logs, 'my-service', 'service-123')

      expect(mockCreateObjectURL).toHaveBeenCalled()
      expect(createElementCalls.length).toBeGreaterThan(0)
      expect(mockClick).toHaveBeenCalled()
      expect(mockRevokeObjectURL).toHaveBeenCalled()
    })

    test('uses serviceName for filename', () => {
      const logs = ['line1']
      downloadLogs(logs, 'my-service', 'service-123')

      expect(createElementCalls[0].download).toBe('my-service.log')
    })

    test('uses serviceId when serviceName is null', () => {
      const logs = ['line1']
      downloadLogs(logs, null, 'service-123')

      expect(createElementCalls[0].download).toBe('service-123.log')
    })

    test('uses default filename when both are null', () => {
      const logs = ['line1']
      downloadLogs(logs, null, null)

      expect(createElementCalls[0].download).toBe('logs.log')
    })

    test('handles null logs', () => {
      downloadLogs(null, 'service', 'id')
      expect(mockCreateObjectURL).toHaveBeenCalled()
      expect(mockClick).toHaveBeenCalled()
    })

    test('handles empty logs array', () => {
      downloadLogs([], 'service', 'id')
      expect(mockCreateObjectURL).toHaveBeenCalled()
      expect(mockClick).toHaveBeenCalled()
    })

    test('handles whitespace in service name', () => {
      const logs = ['line1']
      downloadLogs(logs, 'my service name', 'service-123')

      expect(createElementCalls[0].download).toBe('my service name.log')
    })

    test('revokes URL after click', () => {
      const logs = ['line1']
      downloadLogs(logs, 'service', 'id')

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    })
  })
})
