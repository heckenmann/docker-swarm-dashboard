import { toDefaultDateTimeString } from '../../../src/common/DefaultDateTimeFormat'

describe('DefaultDateTimeFormat', () => {
  test('formats with default and custom timezone/locale', () => {
    const d = new Date('2020-01-02T03:04:05Z')
    const s1 = toDefaultDateTimeString(d)
    expect(typeof s1).toBe('string')
    const s2 = toDefaultDateTimeString(d, 'en-US', 'UTC')
    expect(typeof s2).toBe('string')
  })
})
