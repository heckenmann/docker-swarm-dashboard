/**
 * Consolidated unit tests for common utility functions: flatten and serviceFilter.
 * Merged from: utils.test.js, utils_extra.test.js, utils_extra.coverage.test.js, utils_serviceFilter.test.js
 */
import { flatten, serviceFilter } from '../../../src/common/utils'

// ─── flatten ────────────────────────────────────────────────────────────────

describe('flatten', () => {
  test('flattens nested arrays into keyed object', () => {
    const input = [[1, 2], [3], []]
    expect(flatten(input)).toEqual({ '[0].[0]': 1, '[0].[1]': 2, '[1].[0]': 3 })
  })

  test('flattens nested plain objects', () => {
    const obj = { a: { b: 1 }, arr: [1, { x: 2 }] }
    const flat = flatten(obj)
    expect(flat['a.b']).toBe(1)
    expect(Object.values(flat)).toContain(1)
    const hasX = Object.keys(flat).some((k) => k.endsWith('.x') && flat[k] === 2)
    expect(hasX).toBe(true)
  })

  test('flattens mixed nested objects and arrays', () => {
    const obj = { a: { b: 1 }, c: [2, { d: 3 }] }
    const out = flatten(obj)
    expect(out['a.b']).toBe(1)
    expect(out['c.[0]']).toBe(2)
    expect(out['c.[1].d']).toBe(3)
  })
})

// ─── serviceFilter ───────────────────────────────────────────────────────────

describe('serviceFilter', () => {
  const svc = { Name: 'my-service', Stack: 'prod-stack' }

  test('no filters returns true', () => {
    expect(serviceFilter(svc)).toBe(true)
    expect(serviceFilter(svc, '', '')).toBe(true)
  })

  test('serviceNameFilter only', () => {
    expect(serviceFilter(svc, 'my')).toBe(true)
    expect(serviceFilter(svc, 'my', '')).toBe(true)
    expect(serviceFilter(svc, 'w', '')).toBe(false)
    expect(serviceFilter(svc, 'nomatch')).toBe(false)
  })

  test('stackNameFilter only', () => {
    expect(serviceFilter(svc, undefined, 'prod')).toBe(true)
    expect(serviceFilter(svc, '', 'prod')).toBe(true)
    expect(serviceFilter(svc, '', 'x')).toBe(false)
    expect(serviceFilter(svc, undefined, 'nope')).toBe(false)
  })

  test('both filters (AND logic)', () => {
    expect(serviceFilter(svc, 'my', 'prod')).toBe(true)
    expect(serviceFilter(svc, 'my', 'x')).toBe(false)
    expect(serviceFilter(svc, 'no', 'prod')).toBe(false)
  })
})

