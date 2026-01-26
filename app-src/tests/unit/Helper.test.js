import { getStyleClassForState } from '../../src/Helper'

describe('getStyleClassForState', () => {
  test('returns success for running state', () => {
    expect(getStyleClassForState('running')).toBe('success')
  })

  test('returns danger for failed/rejected/orphaned', () => {
    expect(getStyleClassForState('failed')).toBe('danger')
    expect(getStyleClassForState('rejected')).toBe('danger')
    expect(getStyleClassForState('orphaned')).toBe('danger')
  })

  test('returns dark for shutdown and complete', () => {
    expect(getStyleClassForState('shutdown')).toBe('dark')
    expect(getStyleClassForState('complete')).toBe('dark')
  })

  test('returns warning for transitional states', () => {
    const transitional = [
      'new',
      'ready',
      'pending',
      'preparing',
      'starting',
      'assigned',
      'accepted',
      'remove',
    ]
    transitional.forEach((s) =>
      expect(getStyleClassForState(s)).toBe('warning'),
    )
  })

  test('returns secondary for unknown states', () => {
    expect(getStyleClassForState('bogus')).toBe('secondary')
    expect(getStyleClassForState(undefined)).toBe('secondary')
  })
})
