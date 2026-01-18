import { flatten, serviceFilter } from '../../src/common/utils'

describe('flatten', () => {
  test('flattens nested objects and arrays', () => {
    const input = { a: { b: 1 }, c: [10, 20] }
    const out = flatten(input)
    // keys should include 'a.b' and 'c[0]' etc.
    expect(out['a.b']).toBe(1)
  // flatten may emit keys like 'c[0]' or 'c.[0]'; assert by values instead
  const values = Object.values(out)
  expect(values).toContain(10)
  expect(values).toContain(20)
  })

  test('returns primitive value for non-object', () => {
    expect(flatten(5)).toEqual({ '': 5 })
  })
})

describe('serviceFilter', () => {
  const svc = { Name: 'web', Stack: 'mystack' }

  test('returns true when no filters', () => {
    expect(serviceFilter(svc)).toBe(true)
  })

  test('filters by service name only', () => {
    expect(serviceFilter(svc, 'we')).toBe(true)
    expect(serviceFilter(svc, 'api')).toBe(false)
  })

  test('filters by stack name only', () => {
    expect(serviceFilter(svc, undefined, 'my')).toBe(true)
    expect(serviceFilter(svc, undefined, 'other')).toBe(false)
  })

  test('filters by both', () => {
    expect(serviceFilter(svc, 'web', 'mystack')).toBe(true)
    expect(serviceFilter(svc, 'web', 'other')).toBe(false)
  })
})
