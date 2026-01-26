import { parseHashToObj } from '../../../src/common/store/atoms'

describe('parseHashToObj', () => {
  test('parses quoted base and other keys', () => {
    const h = '#base="http%3A%2F%2Fexample.com%2F"&x=1'
    const out = parseHashToObj(h)
    expect(out.base).toContain('http')
    expect(out.x).toBe('1')
  })

  test('returns empty object for empty hash', () => {
    expect(parseHashToObj('')).toEqual({})
  })

  test('handles malformed pairs gracefully', () => {
    const out = parseHashToObj('#badpair')
    expect(typeof out).toBe('object')
  })

  test('falls back when decodeURIComponent throws', () => {
    // malformed percent sequence will throw in decodeURIComponent
    const out = parseHashToObj('#a=%')
    expect(out.a).toBe('%')
  })
})
