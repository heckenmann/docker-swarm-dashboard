import { serviceFilter } from '../../../src/common/utils'

describe('serviceFilter', () => {
  const svc = { Name: 'my-service', Stack: 'prod-stack' }

  test('no filters returns true', () => {
    expect(serviceFilter(svc, '', '')).toBe(true)
  })

  test('serviceName filter only', () => {
    expect(serviceFilter(svc, 'my', '')).toBe(true)
    expect(serviceFilter(svc, 'other', '')).toBe(false)
  })

  test('stack filter only', () => {
    expect(serviceFilter(svc, '', 'prod')).toBe(true)
    expect(serviceFilter(svc, '', 'x')).toBe(false)
  })

  test('both filters', () => {
    expect(serviceFilter(svc, 'my', 'prod')).toBe(true)
    expect(serviceFilter(svc, 'my', 'x')).toBe(false)
    expect(serviceFilter(svc, 'no', 'prod')).toBe(false)
  })
})
