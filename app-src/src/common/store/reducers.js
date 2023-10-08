export const RefreshIntervalToggleReducer = (prev) => {
  return prev ? null : 3000
}

export const MessageReducer = (prev, action) => {
  if (action.type === 'add') {
    const next = prev.filter((e) => e !== action.value)
    next.push(action.value)
    return next
  }
  if (action.type === 'remove') {
    const next = prev.filter((e) => e !== action.value)
    return next
  }
  throw new Error('unknown action type')
}
