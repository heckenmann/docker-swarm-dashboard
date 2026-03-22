/**
 * Consolidated unit tests for common store reducers.
 * Merged from: reducers.test.js, reducers_extra.test.js
 */
import {
  RefreshIntervalToggleReducer,
  MessageReducer,
} from '../../../src/common/store/reducers'

describe('RefreshIntervalToggleReducer', () => {
  test('sets the provided interval value', () => {
    expect(RefreshIntervalToggleReducer(null, 5000)).toBe(5000)
    expect(RefreshIntervalToggleReducer(3000, 10000)).toBe(10000)
    expect(RefreshIntervalToggleReducer(5000, null)).toBeNull()
  })

  test('returns undefined when no newInterval provided', () => {
    expect(RefreshIntervalToggleReducer(null)).toBeUndefined()
  })
})

describe('MessageReducer', () => {
  test('add appends new messages', () => {
    let state = []
    state = MessageReducer(state, { type: 'add', value: 'a' })
    expect(state).toEqual(['a'])
    state = MessageReducer(state, { type: 'add', value: 'b' })
    expect(state).toEqual(['a', 'b'])
  })

  test('add moves duplicate to end', () => {
    let state = ['a', 'b']
    state = MessageReducer(state, { type: 'add', value: 'a' })
    expect(state).toEqual(['b', 'a'])
  })

  test('remove deletes matching message', () => {
    let state = ['a', 'b']
    state = MessageReducer(state, { type: 'remove', value: 'a' })
    expect(state).toEqual(['b'])
  })

  test('throws on unknown action type', () => {
    expect(() => MessageReducer([], { type: 'foo', value: 'x' })).toThrow(
      'unknown action type',
    )
  })
})

