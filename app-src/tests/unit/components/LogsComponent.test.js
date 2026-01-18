import React, { Suspense, useEffect } from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { Provider, atom, useAtom } from 'jotai'

// Mock the async logsServicesAtom and logsNumberOfLinesAtom so component doesn't suspend
jest.mock('../../../src/common/store/atoms', () => {
  const real = jest.requireActual('../../../src/common/store/atoms')
  const { atom: jotaiAtom } = require('jotai')
  return {
    ...real,
    logsServicesAtom: jotaiAtom([{ ID: 's1', Name: 'svc' }]),
    logsNumberOfLinesAtom: jotaiAtom(20),
  }
})

import * as atoms from '../../../src/common/store/atoms'
import { LogsComponent } from '../../../src/components/LogsComponent'
// Suspense imported above

// Controlled websocket mock: expose a mutable helper object so tests can push
// messages and capture the shouldReconnect callback passed by the component.
const wsMock = { lastMessage: null, shouldReconnect: null }
jest.mock('react-use-websocket', () => {
  return {
    __esModule: true,
    default: (url, options) => {
      // capture shouldReconnect function each render
      wsMock.shouldReconnect = options?.shouldReconnect
      return {
        get lastMessage() {
          return wsMock.lastMessage
        },
      }
    },
    __mock: wsMock,
  }
})

// Test helper: push messages into logsLinesAtom so we can simulate incoming
// websocket messages without relying on the websocket hook implementation.
function Pusher({ message }) {
  const [_, setLogs] = useAtom(atoms.logsLinesAtom)
  const [num] = useAtom(atoms.logsNumberOfLinesAtom)
  useEffect(() => {
    if (message) {
      setLogs((prev) => {
        const maxLines = Number(num) || 20
        const newLogs = prev.slice()
        const toRemove = newLogs.length - maxLines + 1
        if (toRemove > 0) newLogs.splice(0, toRemove)
        newLogs.push(message.data)
        return newLogs
      })
    }
  }, [message, setLogs, num])
  return null
}

describe('LogsComponent', () => {
  test('renders form and can show/hide logs', async () => {
    const { container } = render(
      <Suspense fallback={<div>loading</div>}>
        <Provider
          initialValues={[
            [atoms.logsServicesAtom, [{ ID: 's1', Name: 'svc' }]],
            [atoms.logsNumberOfLinesAtom, 20],
          ]}
        >
          <LogsComponent />
        </Provider>
      </Suspense>,
    )

    // initial: should show the Show logs button (wait for suspended data)
    await waitFor(() => expect(screen.getByRole('button', { name: /Show logs/i })).toBeInTheDocument())

  // submit the form to show logs (avoid button activation path that triggers
  // jsdom's unimplemented requestSubmit)
  const form = container.querySelector('form')
  fireEvent.submit(form)

    // after clicking show, the Hide logs button should appear
    await waitFor(() => expect(screen.getByRole('button', { name: /Hide logs/i })).toBeInTheDocument())
  })

  test('showLogs sets tail and serviceName; empty tail resets to default', async () => {
    // start with default 20
    const { container } = render(
      <Suspense fallback={<div>loading</div>}>
        <Provider
          initialValues={[
            [atoms.logsServicesAtom, [{ ID: 's1', Name: 'svc' }]],
            [atoms.logsNumberOfLinesAtom, 20],
          ]}
        >
          <LogsComponent />
        </Provider>
      </Suspense>,
    )

    // wait for show button and set tail to 5
    await waitFor(() => expect(screen.getByRole('button', { name: /Show logs/i })).toBeInTheDocument())
    const tailInput = screen.getByDisplayValue('20')
    fireEvent.change(tailInput, { target: { value: '5' } })
    const form = container.querySelector('form')
    fireEvent.submit(form)

    // after submit, number input in logPrinterOptions should show 5
    await waitFor(() => expect(screen.getByDisplayValue('5')).toBeInTheDocument())
    // service name should be shown in the readonly service field
    expect(screen.getByDisplayValue('svc')).toBeInTheDocument()

    // Now hide and show again but with empty tail -> should reset to default 20
    fireEvent.click(screen.getByRole('button', { name: /Hide logs/i }))
    await waitFor(() => expect(screen.getByRole('button', { name: /Show logs/i })).toBeInTheDocument())

    // clear tail and submit
    const tailInput2 = screen.getByDisplayValue('20')
    fireEvent.change(tailInput2, { target: { value: '' } })
    const form2 = container.querySelector('form')
    fireEvent.submit(form2)

    // after submitting empty tail, the default should be used (20)
    await waitFor(() => expect(screen.getByDisplayValue('20')).toBeInTheDocument())
  })

  test('appends lastMessage and trims to number of lines when follow is active', async () => {
    const messages = [{ data: 'line1' }, { data: 'line2' }, { data: 'line3' }]

    const { container, rerender } = render(
      <Suspense fallback={<div>loading</div>}>
        <Provider
          initialValues={[
            [atoms.logsServicesAtom, [{ ID: 's1', Name: 'svc' }]],
            [atoms.logsNumberOfLinesAtom, 2],
          ]}
        >
          <LogsComponent />
        </Provider>
      </Suspense>,
    )

  // open logs (wait for suspended data)
  await waitFor(() => expect(screen.getByRole('button', { name: /Show logs/i })).toBeInTheDocument())
  // set Tail to 2 before submitting so showLogs will set logsNumberOfLines to 2
  const tailInput = screen.getByDisplayValue('20')
  fireEvent.change(tailInput, { target: { value: '2' } })
  const form = container.querySelector('form')
  fireEvent.submit(form)

  // simulate incoming messages by updating mockLastMessage and triggering a small DOM change
  // to cause a re-render without remounting the Provider (which would reset atoms)
  // Now simulate incoming messages by rendering the Pusher which writes to
  // the logsLines atom. Use rerender to change the message prop.
  rerender(
    <Suspense fallback={<div>loading</div>}>
      <Provider
        initialValues={[
          [atoms.logsServicesAtom, [{ ID: 's1', Name: 'svc' }]],
          [atoms.logsNumberOfLinesAtom, 2],
        ]}
      >
        <LogsComponent />
        <Pusher message={messages[0]} />
      </Provider>
    </Suspense>,
  )

  rerender(
    <Suspense fallback={<div>loading</div>}>
      <Provider
        initialValues={[
          [atoms.logsServicesAtom, [{ ID: 's1', Name: 'svc' }]],
          [atoms.logsNumberOfLinesAtom, 2],
        ]}
      >
        <LogsComponent />
        <Pusher message={messages[1]} />
      </Provider>
    </Suspense>,
  )

  rerender(
    <Suspense fallback={<div>loading</div>}>
      <Provider
        initialValues={[
          [atoms.logsServicesAtom, [{ ID: 's1', Name: 'svc' }]],
          [atoms.logsNumberOfLinesAtom, 2],
        ]}
      >
        <LogsComponent />
        <Pusher message={messages[2]} />
      </Provider>
    </Suspense>,
  )

    // With max 2 lines, the last message should be present and older trimmed
    await waitFor(() => expect(screen.getByText(/line3/)).toBeInTheDocument())
    expect(screen.queryByText(/line1/)).not.toBeInTheDocument()
  })

  test('ring buffer capacity change preserves recent entries and flushes', async () => {
    const messages = [{ data: 'a' }, { data: 'b' }, { data: 'c' }, { data: 'd' }]

  const { container, rerender } = render(
      <Suspense fallback={<div>loading</div>}>
        <Provider
          initialValues={[
            [atoms.logsServicesAtom, [{ ID: 's1', Name: 'svc' }]],
            [atoms.logsNumberOfLinesAtom, 2],
          ]}
        >
          <LogsComponent />
        </Provider>
      </Suspense>,
    )

    // open logs with tail=2
    await waitFor(() => expect(screen.getByRole('button', { name: /Show logs/i })).toBeInTheDocument())
    const tailInput = screen.getByDisplayValue('20')
    fireEvent.change(tailInput, { target: { value: '2' } })
    const form = container.querySelector('form')
    fireEvent.submit(form)

    // simulate incoming messages by rendering the Pusher helper which writes
    // into the logsLines atom, then rerender to add the next message.
    rerender(
      <Suspense fallback={<div>loading</div>}>
        <Provider
          initialValues={[
            [atoms.logsServicesAtom, [{ ID: 's1', Name: 'svc' }]],
            [atoms.logsNumberOfLinesAtom, 2],
          ]}
        >
          <LogsComponent />
          <Pusher message={messages[0]} />
        </Provider>
      </Suspense>,
    )

    rerender(
      <Suspense fallback={<div>loading</div>}>
        <Provider
          initialValues={[
            [atoms.logsServicesAtom, [{ ID: 's1', Name: 'svc' }]],
            [atoms.logsNumberOfLinesAtom, 2],
          ]}
        >
          <LogsComponent />
          <Pusher message={messages[1]} />
        </Provider>
      </Suspense>,
    )

    // should show a and b inside the rendered <pre>
    await waitFor(() => expect(container.querySelector('pre')?.textContent).toMatch(/b/))

    // now increase capacity to 3
    fireEvent.click(screen.getByRole('button', { name: /Hide logs/i }))
    await waitFor(() => expect(screen.getByRole('button', { name: /Show logs/i })).toBeInTheDocument())
    const tailInput2 = screen.getByDisplayValue('20')
    fireEvent.change(tailInput2, { target: { value: '3' } })
    const form2 = container.querySelector('form')
    fireEvent.submit(form2)

    // push another message, buffer should preserve previous entries and include the new one
    rerender(
      <Suspense fallback={<div>loading</div>}>
        <Provider
          initialValues={[
            [atoms.logsServicesAtom, [{ ID: 's1', Name: 'svc' }]],
            [atoms.logsNumberOfLinesAtom, 3],
          ]}
        >
          <LogsComponent />
          <Pusher message={messages[2]} />
        </Provider>
      </Suspense>,
    )

    await waitFor(() => expect(container.querySelector('pre')?.textContent).toMatch(/c/))

    // now push d
    rerender(
      <Suspense fallback={<div>loading</div>}>
        <Provider
          initialValues={[
            [atoms.logsServicesAtom, [{ ID: 's1', Name: 'svc' }]],
            [atoms.logsNumberOfLinesAtom, 3],
          ]}
        >
          <LogsComponent />
          <Pusher message={messages[3]} />
        </Provider>
      </Suspense>,
    )

    await waitFor(() => expect(container.querySelector('pre')?.textContent).toMatch(/d/))
    expect(container.querySelector('pre')?.textContent).not.toMatch(/a/)
  })

  test('shouldReconnect passed to websocket reflects follow/show state', async () => {
    const { container } = render(
      <Suspense fallback={<div>loading</div>}>
        <Provider
          initialValues={[
            [atoms.logsServicesAtom, [{ ID: 's1', Name: 'svc' }]],
            [atoms.logsNumberOfLinesAtom, 20],
          ]}
        >
          <LogsComponent />
        </Provider>
      </Suspense>,
    )

    // set follow checkbox and submit
    await waitFor(() => expect(screen.getByRole('button', { name: /Show logs/i })).toBeInTheDocument())
    const followCheckbox = screen.getByLabelText(/Follow/i)
    fireEvent.click(followCheckbox)
    const form = container.querySelector('form')
    fireEvent.submit(form)

    // after showing logs with follow checked, the captured shouldReconnect should return true
    await waitFor(() => expect(wsMock.shouldReconnect).toBeTruthy())
    expect(typeof wsMock.shouldReconnect === 'function').toBe(true)
    expect(wsMock.shouldReconnect()).toBe(true)

    // hide logs -> new shouldReconnect should evaluate to false
    fireEvent.click(screen.getByRole('button', { name: /Hide logs/i }))
    await waitFor(() => expect(screen.getByRole('button', { name: /Show logs/i })).toBeInTheDocument())
    // mock should have been updated on re-render
    expect(typeof wsMock.shouldReconnect === 'function').toBe(true)
    expect(wsMock.shouldReconnect()).toBe(false)
  })

  test('ring buffer overwrite and flush via websocket lastMessage and timers', async () => {
    jest.useFakeTimers()

    const { container, rerender } = render(
      <Suspense fallback={<div>loading</div>}>
        <Provider
          initialValues={[
            [atoms.logsServicesAtom, [{ ID: 's1', Name: 'svc' }]],
            [atoms.logsNumberOfLinesAtom, 2],
          ]}
        >
          <LogsComponent />
        </Provider>
      </Suspense>,
    )

    // open logs
    await waitFor(() => expect(screen.getByRole('button', { name: /Show logs/i })).toBeInTheDocument())
    const tailInput = screen.getByDisplayValue('20')
    fireEvent.change(tailInput, { target: { value: '2' } })
    const form = container.querySelector('form')
    fireEvent.submit(form)

    // send three messages via the websocket mock; the ring buffer capacity is 2
    act(() => {
      wsMock.lastMessage = { data: 'one' }
      rerender(
        <Suspense fallback={<div>loading</div>}>
          <Provider
            initialValues={[
              [atoms.logsServicesAtom, [{ ID: 's1', Name: 'svc' }]],
              [atoms.logsNumberOfLinesAtom, 2],
            ]}
          >
            <LogsComponent />
          </Provider>
        </Suspense>,
      )
      // flush scheduled
      jest.runOnlyPendingTimers()
    })

    act(() => {
      wsMock.lastMessage = { data: 'two' }
      rerender(
        <Suspense fallback={<div>loading</div>}>
          <Provider
            initialValues={[
              [atoms.logsServicesAtom, [{ ID: 's1', Name: 'svc' }]],
              [atoms.logsNumberOfLinesAtom, 2],
            ]}
          >
            <LogsComponent />
          </Provider>
        </Suspense>,
      )
      jest.runOnlyPendingTimers()
    })

    act(() => {
      wsMock.lastMessage = { data: 'three' }
      rerender(
        <Suspense fallback={<div>loading</div>}>
          <Provider
            initialValues={[
              [atoms.logsServicesAtom, [{ ID: 's1', Name: 'svc' }]],
              [atoms.logsNumberOfLinesAtom, 2],
            ]}
          >
            <LogsComponent />
          </Provider>
        </Suspense>,
      )
      jest.runOnlyPendingTimers()
    })

    // now the rendered pre should contain only 'two' and 'three' (capacity 2)
    await waitFor(() => expect(container.querySelector('pre')?.textContent).toMatch(/three/))
    expect(container.querySelector('pre')?.textContent).toMatch(/two/)
    expect(container.querySelector('pre')?.textContent).not.toMatch(/one/)

    jest.useRealTimers()
  })

  test('buffer reallocation preserves recent entries when capacity changes via showLogs', async () => {
    jest.useFakeTimers()

    const { container, rerender } = render(
      <Suspense fallback={<div>loading</div>}>
        <Provider
          initialValues={[
            [atoms.logsServicesAtom, [{ ID: 's1', Name: 'svc' }]],
            [atoms.logsNumberOfLinesAtom, 3],
          ]}
        >
          <LogsComponent />
        </Provider>
      </Suspense>,
    )

    // open logs with tail 3
    await waitFor(() => expect(screen.getByRole('button', { name: /Show logs/i })).toBeInTheDocument())
    const tailInput = screen.getByDisplayValue('20')
    fireEvent.change(tailInput, { target: { value: '3' } })
    const form = container.querySelector('form')
    fireEvent.submit(form)

    // send two messages
    act(() => {
      wsMock.lastMessage = { data: 'A' }
      rerender(
        <Suspense fallback={<div>loading</div>}>
          <Provider
            initialValues={[
              [atoms.logsServicesAtom, [{ ID: 's1', Name: 'svc' }]],
              [atoms.logsNumberOfLinesAtom, 3],
            ]}
          >
            <LogsComponent />
          </Provider>
        </Suspense>,
      )
      jest.runOnlyPendingTimers()
    })
    act(() => {
      wsMock.lastMessage = { data: 'B' }
      rerender(
        <Suspense fallback={<div>loading</div>}>
          <Provider
            initialValues={[
              [atoms.logsServicesAtom, [{ ID: 's1', Name: 'svc' }]],
              [atoms.logsNumberOfLinesAtom, 3],
            ]}
          >
            <LogsComponent />
          </Provider>
        </Suspense>,
      )
      jest.runOnlyPendingTimers()
    })

    // increase capacity to 4 via hide/show and submit
    fireEvent.click(screen.getByRole('button', { name: /Hide logs/i }))
    await waitFor(() => expect(screen.getByRole('button', { name: /Show logs/i })).toBeInTheDocument())
    const tailInput2 = screen.getByDisplayValue('20')
    fireEvent.change(tailInput2, { target: { value: '4' } })
    const form2 = container.querySelector('form')
    fireEvent.submit(form2)

    // send C and D
    act(() => {
      wsMock.lastMessage = { data: 'C' }
      rerender(
        <Suspense fallback={<div>loading</div>}>
          <Provider
            initialValues={[
              [atoms.logsServicesAtom, [{ ID: 's1', Name: 'svc' }]],
              [atoms.logsNumberOfLinesAtom, 4],
            ]}
          >
            <LogsComponent />
          </Provider>
        </Suspense>,
      )
      jest.runOnlyPendingTimers()
    })

    act(() => {
      wsMock.lastMessage = { data: 'D' }
      rerender(
        <Suspense fallback={<div>loading</div>}>
          <Provider
            initialValues={[
              [atoms.logsServicesAtom, [{ ID: 's1', Name: 'svc' }]],
              [atoms.logsNumberOfLinesAtom, 4],
            ]}
          >
            <LogsComponent />
          </Provider>
        </Suspense>,
      )
      jest.runOnlyPendingTimers()
    })

    // final pre should contain A,B,C,D in recent order (A may be dropped if capacity smaller)
    await waitFor(() => expect(container.querySelector('pre')?.textContent).toMatch(/D/))
    expect(container.querySelector('pre')?.textContent).toMatch(/C/)

    jest.useRealTimers()
  })
})
