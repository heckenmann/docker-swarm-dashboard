/**
 * Reducer to set the refresh interval.
 * @param {number|null} prev - The previous state of the refresh interval.
 * @param {number|null} newInterval - The new interval value to set.
 * @returns {number|null} - Returns the new interval value.
 */
export const RefreshIntervalToggleReducer = (prev, newInterval) => {
  return newInterval
}
/**
 * Reducer to manage messages.
 * @param {Array} prev - The previous state of the messages.
 * @param {object} action - The action to be performed on the messages.
 * @param {string} action.type - The type of action ('add' or 'remove').
 * @param {*} action.value - The value to be added or removed.
 * @returns {Array} - The new state of the messages.
 */
export const MessageReducer = (prev = [], action) => {
  if (action.type === 'add') {
    const next = prev.filter((e) => e !== action.value)
    next.push(action.value)
    return next
  }
  if (action.type === 'remove') {
    return prev.filter((e) => e !== action.value)
  }
  throw new Error('unknown action type')
}
