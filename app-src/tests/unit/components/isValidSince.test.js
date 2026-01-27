import { isValidSince } from '../../../src/components/LogsComponent'

test('isValidSince handles duration, ISO and invalid inputs', () => {
  expect(isValidSince('5m')).toBe(true)
  expect(isValidSince('1h')).toBe(true)
  expect(isValidSince('2020-01-01T00:00:00Z')).toBe(true)
  expect(isValidSince('not-a-date')).toBe(false)
  expect(isValidSince('')).toBe(false)
})
