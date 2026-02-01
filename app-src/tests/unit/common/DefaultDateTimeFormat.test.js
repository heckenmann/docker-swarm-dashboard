import { toDefaultDateTimeString } from '../../../src/common/DefaultDateTimeFormat'

describe('DefaultDateTimeFormat', () => {
  test('formats with default and custom timezone/locale', () => {
    const d = new Date('2020-01-02T03:04:05Z')
    const s1 = toDefaultDateTimeString(d)
    expect(typeof s1).toBe('string')
    const s2 = toDefaultDateTimeString(d, 'en-US', 'UTC')
    expect(typeof s2).toBe('string')
  })

  test('returns dash for undefined, null, and invalid dates', () => {
    expect(toDefaultDateTimeString(undefined)).toBe('-')
    expect(toDefaultDateTimeString(null)).toBe('-')
    // invalid string
    expect(toDefaultDateTimeString('not-a-date')).toBe('-')
  })

  test('accepts ISO string input and returns formatted string', () => {
    const iso = '2021-05-06T07:08:09Z'
    const out = toDefaultDateTimeString(iso)
    expect(typeof out).toBe('string')
    expect(out).not.toBe('-')
  })
})
