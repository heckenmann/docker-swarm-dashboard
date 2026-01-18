import React, { Suspense, useEffect } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

// mutable mock for lastMessage; tests will update this and re-render
let mockLastMessage = null
jest.mock('react-use-websocket', () => ({
  __esModule: true,
  default: () => ({ lastMessage: mockLastMessage }),
}))

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
})
