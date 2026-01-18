// utils.test.js
// Tests for utility functions: flatten (object flattener) and serviceFilter (service filtering by Name/Stack).
import { flatten, serviceFilter } from '../../../src/common/utils'

test('flatten flattens nested arrays into flattened object', () => {
	const input = [[1, 2], [3], []]
	// implementation flattens arrays into keyed object
	expect(flatten(input)).toEqual({ '[0].[0]': 1, '[0].[1]': 2, '[1].[0]': 3 })
})

test('serviceFilter filters by Name and Stack correctly', () => {
	const service = { Name: 'web', Stack: 'frontend' }
	expect(serviceFilter(service, 'w', '')).toBe(true)
	expect(serviceFilter(service, '', 'front')).toBe(true)
	expect(serviceFilter(service, 'x', '')).toBe(false)
})
