/**
 * Consolidated unit tests for common store reducers.
 * Merged from: reducers.test.js, reducers_extra.test.js
 */
import {
  RefreshIntervalToggleReducer,
  MessageReducer,
} from '../../../src/common/store/reducers'

describe('RefreshIntervalToggleReducer', () => {
  test('toggles null → 3000', () => {
    expect(RefreshIntervalToggleReducer(null)).toBe(3000)
  })

  test('toggles 3000 → null', () => {
    expect(RefreshIntervalToggleReducer(3000)).toBeNull()
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

