import { flatten, serviceFilter } from '../../../src/common/utils'

test('flatten handles primitives and nested objects/arrays', () => {
  const obj = { a: { b: 1 }, arr: [1, { x: 2 }] }
  const flat = flatten(obj)
  expect(flat['a.b']).toBe(1)
  // array entries may be keyed with bracket syntax; ensure one of the flattened values is 1
  expect(Object.values(flat)).toContain(1)
  // ensure nested object's x value was flattened
  const hasX = Object.keys(flat).some((k) => k.endsWith('.x') && flat[k] === 2)
  expect(hasX).toBe(true)
})

test('serviceFilter handles all combinations', () => {
  const svc = { Name: 'web', Stack: 'mystack' }
  // no filters
  expect(serviceFilter(svc)).toBe(true)
  // service name only
  expect(serviceFilter(svc, 'we')).toBe(true)
  expect(serviceFilter(svc, 'nomatch')).toBe(false)
  // stack only
  expect(serviceFilter(svc, undefined, 'mys')).toBe(true)
  expect(serviceFilter(svc, undefined, 'nope')).toBe(false)
  // both
  expect(serviceFilter(svc, 'web', 'mystack')).toBe(true)
  expect(serviceFilter(svc, 'web', 'nope')).toBe(false)
})
