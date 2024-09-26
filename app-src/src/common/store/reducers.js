/**
 * Reducer to toggle the refresh interval.
 * @param {number|null} prev - The previous state of the refresh interval.
 * @returns {number|null} - Returns 3000 if the previous state was null, otherwise returns null.
 */
export const RefreshIntervalToggleReducer = (prev) => {
  return prev ? null : 3000
}
/**
 * Reducer to manage messages.
 * @param {Array} prev - The previous state of the messages.
 * @param {Object} action - The action to be performed on the messages.
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
