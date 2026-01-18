// reducers.test.js
// Unit tests for reducers used by jotai atoms: toggle reducer and message reducer behavior.
import { RefreshIntervalToggleReducer, MessageReducer } from '../../../src/common/store/reducers'

test('RefreshIntervalToggleReducer toggles between null and 3000', () => {
  expect(RefreshIntervalToggleReducer(null)).toBe(3000)
  expect(RefreshIntervalToggleReducer(3000)).toBeNull()
})

test('MessageReducer add/remove and duplicate handling', () => {
  let state = []
  state = MessageReducer(state, { type: 'add', value: 'a' })
  expect(state).toEqual(['a'])
  state = MessageReducer(state, { type: 'add', value: 'b' })
  expect(state).toEqual(['a', 'b'])
  // adding duplicate should move it to end
  state = MessageReducer(state, { type: 'add', value: 'a' })
  expect(state).toEqual(['b', 'a'])
  state = MessageReducer(state, { type: 'remove', value: 'b' })
  expect(state).toEqual(['a'])
})

test('MessageReducer throws on unknown action', () => {
  expect(() => MessageReducer([], { type: 'foo', value: 'x' })).toThrow('unknown action type')
})
