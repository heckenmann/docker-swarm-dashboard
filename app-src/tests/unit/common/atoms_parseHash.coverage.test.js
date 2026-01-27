import { parseHashToObj } from '../../../src/common/store/atoms'

describe('parseHashToObj', () => {
  test('parses empty hash', () => {
    expect(parseHashToObj('')).toEqual({})
  })

  test('parses key value pairs and decodes', () => {
    const res = parseHashToObj('#base=/app&view=foo')
    expect(res.base).toBe('/app')
    expect(res.view).toBe('foo')
  })

  test('handles decodeURIComponent failure gracefully', () => {
    // % is a malformed sequence for decodeURIComponent and causes a throw
    const res = parseHashToObj('#bad=%')
    expect(res.bad).toBe('%')
  })
})
