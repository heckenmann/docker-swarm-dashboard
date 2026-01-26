import {
  RefreshIntervalToggleReducer,
  MessageReducer,
} from '../../../src/common/store/reducers'

test('RefreshIntervalToggleReducer toggles between null and 3000', () => {
  expect(RefreshIntervalToggleReducer(null)).toBe(3000)
  expect(RefreshIntervalToggleReducer(3000)).toBeNull()
})

test('MessageReducer add and remove', () => {
  let arr = []
  arr = MessageReducer(arr, { type: 'add', value: 'x' })
  expect(arr).toEqual(['x'])
  arr = MessageReducer(arr, { type: 'add', value: 'y' })
  expect(arr).toEqual(['x', 'y'])
  arr = MessageReducer(arr, { type: 'remove', value: 'x' })
  expect(arr).toEqual(['y'])
})

test('MessageReducer throws on unknown action', () => {
  expect(() => MessageReducer([], { type: 'unknown' })).toThrow()
})
