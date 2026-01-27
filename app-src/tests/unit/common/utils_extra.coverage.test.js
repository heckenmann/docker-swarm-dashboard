import { flatten, serviceFilter } from '../../../src/common/utils'

test('flatten flattens nested objects and arrays', () => {
  const obj = { a: { b: 1 }, c: [2, { d: 3 }] }
  const out = flatten(obj)
  expect(out['a.b']).toBe(1)
  expect(out['c.[0]']).toBe(2)
  expect(out['c.[1].d']).toBe(3)
})

test('serviceFilter behavior for various filter combinations', () => {
  const svc = { Name: 'service-1', Stack: 'mystack' }
  // no filters
  expect(serviceFilter(svc)).toBe(true)
  // service name only
  expect(serviceFilter(svc, 'service')).toBe(true)
  expect(serviceFilter(svc, 'nope')).toBe(false)
  // stack only
  expect(serviceFilter(svc, null, 'mystack')).toBe(true)
  expect(serviceFilter(svc, null, 'other')).toBe(false)
  // both filters
  expect(serviceFilter(svc, 'service', 'mystack')).toBe(true)
  expect(serviceFilter(svc, 'service', 'other')).toBe(false)
})
