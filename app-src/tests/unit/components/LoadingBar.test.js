// LoadingBar.test.js
// Tests the LoadingBar shows/hides based on network events and respects the force prop.
import React from 'react'
import { render, act, waitFor } from '@testing-library/react'
import LoadingBar from '../../../src/components/LoadingBar'

jest.useFakeTimers()

describe('LoadingBar', () => {
  afterEach(() => {
    // cleanup any timers
    jest.clearAllTimers()
  })

  test('shows when force=true and hides when unmounted', () => {
    const { container, unmount } = render(<LoadingBar force={true} />)
    const bar = container.querySelector('.loading-bar')
    expect(bar).toBeTruthy()
    expect(bar.classList.contains('visible')).toBe(true)
    // unmount should hide the bar (cleanup)
    unmount()
  })

  test('multiple start/end events do not produce negative counts', async () => {
    const { container } = render(<LoadingBar />)
    const bar = container.querySelector('.loading-bar')
    act(() => {
      window.dispatchEvent(new Event('network-request-start'))
      window.dispatchEvent(new Event('network-request-start'))
    })
    await waitFor(() => expect(bar.classList.contains('visible')).toBe(true))
    act(() => {
      window.dispatchEvent(new Event('network-request-end'))
      window.dispatchEvent(new Event('network-request-end'))
      // extra end should be clamped
      window.dispatchEvent(new Event('network-request-end'))
      jest.advanceTimersByTime(300)
    })
    await waitFor(() => expect(bar.classList.contains('visible')).toBe(false))
  })

  test('shows on network-request-start and hides after network-request-end', async () => {
    const { container } = render(<LoadingBar />)
    const bar = container.querySelector('.loading-bar')
    expect(bar).toBeTruthy()
    // initially not visible
    expect(bar.classList.contains('visible')).toBe(false)

    // dispatch start
    act(() => {
      window.dispatchEvent(new Event('network-request-start'))
    })

    // wait for the visible class to be applied
    await waitFor(() => {
      expect(bar.classList.contains('visible')).toBe(true)
    })

    // dispatch end
    act(() => {
      window.dispatchEvent(new Event('network-request-end'))
    })

    // advance timers for finish timeout and hide delay
    act(() => {
      jest.advanceTimersByTime(300)
    })

    // After the short hiding timeout, bar should not be visible
    await waitFor(() => {
      expect(bar.classList.contains('visible')).toBe(false)
    })
  })
})
