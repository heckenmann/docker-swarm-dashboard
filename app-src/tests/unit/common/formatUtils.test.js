/**
 * Unit tests for src/common/utils/formatUtils.js
 * Covers formatBytes, formatBytesCompact, formatUptime, bytesToMB, pctClass.
 */
import {
  formatBytes,
  formatBytesCompact,
  formatUptime,
  bytesToMB,
  pctClass,
} from '../../../src/common/utils/formatUtils'

describe('formatBytes', () => {
  test('returns "0 Bytes" for 0', () => {
    expect(formatBytes(0)).toBe('0 Bytes')
  })

  test('formats 1 KB correctly', () => {
    expect(formatBytes(1024)).toBe('1 KB')
  })

  test('formats MB with custom decimal places', () => {
    expect(formatBytes(1024 * 1024, 1)).toBe('1 MB')
  })

  test('treats negative decimals as 0', () => {
    expect(formatBytes(1024, -1)).toBe('1 KB')
  })
})

describe('formatBytesCompact', () => {
  test('returns "0 B" for 0', () => {
    expect(formatBytesCompact(0)).toBe('0 B')
  })

  test('formats KB with 1 decimal by default', () => {
    expect(formatBytesCompact(1024)).toBe('1 KB')
  })

  test('formats MB with custom decimals', () => {
    expect(formatBytesCompact(1024 * 1024, 2)).toBe('1 MB')
  })
})

describe('formatUptime', () => {
  test('returns "N/A" for falsy input', () => {
    expect(formatUptime(0)).toBe('N/A')
    expect(formatUptime(null)).toBe('N/A')
    expect(formatUptime(undefined)).toBe('N/A')
  })

  test('formats days, hours, and minutes', () => {
    expect(formatUptime(86400 + 3600 + 60)).toBe('1d 1h 1m')
  })

  test('formats zero days correctly', () => {
    expect(formatUptime(3600)).toBe('0d 1h 0m')
  })

  test('formats only seconds as 0d 0h 0m', () => {
    expect(formatUptime(30)).toBe('0d 0h 0m')
  })
})

describe('bytesToMB', () => {
  test('converts bytes to megabytes with 2 decimal places', () => {
    expect(bytesToMB(1024 * 1024)).toBe('1.00')
  })

  test('converts fractional megabytes correctly', () => {
    expect(bytesToMB(1024 * 1024 * 2.5)).toBe('2.50')
  })

  test('converts 0 bytes to "0.00"', () => {
    expect(bytesToMB(0)).toBe('0.00')
  })
})

describe('pctClass', () => {
  test('returns danger class when percentage is above 90', () => {
    expect(pctClass(91)).toBe('text-danger fw-bold')
    expect(pctClass(100)).toBe('text-danger fw-bold')
  })

  test('returns warning class when percentage is above 75 but not above 90', () => {
    expect(pctClass(76)).toBe('text-warning fw-bold')
    expect(pctClass(90)).toBe('text-warning fw-bold')
  })

  test('returns empty string at or below 75', () => {
    expect(pctClass(75)).toBe('')
    expect(pctClass(0)).toBe('')
  })
})
