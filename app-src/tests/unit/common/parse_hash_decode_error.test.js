import { parseHashToObj } from '../../../src/common/store/atoms'

describe('parseHashToObj edge cases', () => {
  test('malformed percent-encoding falls back to raw value and strips quotes', () => {
    // %ZZ is invalid percent-encoding and will cause decodeURIComponent to throw
    const out = parseHashToObj('#a=%ZZ&b=%22x%22')
    // a should be raw %ZZ (quotes removed if present)
    expect(out.a).toBe('%ZZ')
    // b decodes to "x" then replaceAll removes quotes -> x
    expect(out.b).toBe('x')
  })

  test('handles values with embedded quotes and without hash prefix', () => {
    const out = parseHashToObj('base="/path/to/app"&c=1')
    expect(out.base).toBe('/path/to/app')
    expect(out.c).toBe('1')
  })

  test('returns empty object for non-string or empty input', () => {
    expect(parseHashToObj()).toEqual({})
    expect(parseHashToObj('')).toEqual({})
    expect(parseHashToObj('#')).toEqual({})
  })
})
