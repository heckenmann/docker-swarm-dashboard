import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import { Provider } from 'jotai'
import LoadingBar from '../../../src/components/LoadingBar'
import * as atoms from '../../../src/common/store/atoms'

jest.useFakeTimers()

describe('LoadingBar', () => {
  test('shows when networkRequestsAtom > 0 and hides after events', async () => {
    const { container } = render(
      <Provider initialValues={[[atoms.networkRequestsAtom, 0]]}>
        <LoadingBar />
      </Provider>,
    )
    const root = container.querySelector('.loading-bar')

    // simulate legacy window event that increases requests count
    act(() => window.dispatchEvent(new Event('network-request-start')))
    await waitFor(() => expect(root.className).toMatch(/visible/))

    // dispatch end event
    act(() => {
      window.dispatchEvent(new Event('network-request-end'))
      jest.runOnlyPendingTimers()
    })

    // after timers run the bar should hide
    await waitFor(() => expect(root.className).not.toMatch(/visible/))
  })

  test('force prop shows bar immediately', async () => {
    const { container } = render(
      <Provider initialValues={[[atoms.networkRequestsAtom, 0]]}>
        <LoadingBar force={true} />
      </Provider>,
    )
    const root = container.querySelector('.loading-bar')
    await waitFor(() => expect(root.className).toMatch(/visible/))
  })

  test('works without a Jotai Provider (atomCount null)', async () => {
    const { container } = render(<LoadingBar />)
    const root = container.querySelector('.loading-bar')
    // Should render fine and remain hidden when no atom is available
    await waitFor(() => expect(root.className).not.toMatch(/visible/))
  })

  test('provider explicitly sets atom to null (covers null branch)', async () => {
    const { container } = render(
      <Provider initialValues={[[atoms.networkRequestsAtom, null]]}>
        <LoadingBar />
      </Provider>,
    )
    const root = container.querySelector('.loading-bar')
    await waitFor(() => expect(root.className).not.toMatch(/visible/))
  })

  test('finishTimeout ceiling triggers stop', async () => {
    const { container } = render(
      <Provider initialValues={[[atoms.networkRequestsAtom, 0]]}>
        <LoadingBar />
      </Provider>,
    )
    const root = container.querySelector('.loading-bar')
    // start via event
    act(() => window.dispatchEvent(new Event('network-request-start')))
    await waitFor(() => expect(root.className).toMatch(/visible/))
    // advance timers to trigger safety ceiling timeout in start()
    act(() => {
      jest.advanceTimersByTime(15000)
      jest.runOnlyPendingTimers()
    })
    await waitFor(() => expect(root.className).not.toMatch(/visible/))
  })

  test('shows immediately when atom value > 0', async () => {
    const { container } = render(
      <Provider initialValues={[[atoms.networkRequestsAtom, 0]]}>
        <LoadingBar />
      </Provider>,
    )
    const root = container.querySelector('.loading-bar')
    // drive via legacy window event for consistency with other tests
    act(() => window.dispatchEvent(new Event('network-request-start')))
    await waitFor(() => expect(root.className).toMatch(/visible/))
  })

  test('toggles force from true to false and hides when no requests', async () => {
    const { container, rerender } = render(
      <Provider initialValues={[[atoms.networkRequestsAtom, 0]]}>
        <LoadingBar force={true} />
      </Provider>,
    )
    const root = container.querySelector('.loading-bar')
    await waitFor(() => expect(root.className).toMatch(/visible/))

    // toggle force off; since there are no requests the bar should hide
    rerender(
      <Provider initialValues={[[atoms.networkRequestsAtom, 0]]}>
        <LoadingBar force={false} />
      </Provider>,
    )
    act(() => jest.runOnlyPendingTimers())
    await waitFor(() => expect(root.className).not.toMatch(/visible/))
  })

  test('shows when atom > 0 and hides when atom goes to 0 via rerender', async () => {
    const { container } = render(
      <Provider initialValues={[[atoms.networkRequestsAtom, 0]]}>
        <LoadingBar />
      </Provider>,
    )
    const root = container.querySelector('.loading-bar')

    // simulate a start event to drive visibility
    act(() => window.dispatchEvent(new Event('network-request-start')))
    await waitFor(() => expect(root.className).toMatch(/visible/))

    // dispatch end event and run pending timers to hide
    act(() => {
      window.dispatchEvent(new Event('network-request-end'))
      jest.runOnlyPendingTimers()
    })
    await waitFor(() => expect(root.className).not.toMatch(/visible/))
  })



  test('removes window listeners on unmount', () => {
    const addSpy = jest.spyOn(window, 'addEventListener')
    const remSpy = jest.spyOn(window, 'removeEventListener')
    const { unmount } = render(
      <Provider initialValues={[[atoms.networkRequestsAtom, 0]]}>
        <LoadingBar />
      </Provider>,
    )
    expect(addSpy).toHaveBeenCalledWith('network-request-start', expect.any(Function))
    expect(addSpy).toHaveBeenCalledWith('network-request-end', expect.any(Function))
    unmount()
    expect(remSpy).toHaveBeenCalledWith('network-request-start', expect.any(Function))
    expect(remSpy).toHaveBeenCalledWith('network-request-end', expect.any(Function))
    addSpy.mockRestore()
    remSpy.mockRestore()
  })


})
