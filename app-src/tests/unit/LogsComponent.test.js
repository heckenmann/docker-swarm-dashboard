import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider, useAtomValue, useAtom } from 'jotai'
import { useResetAtom } from 'jotai/utils'
import {
  logsFormServiceIdAtom,
  logsFormTailAtom,
  logsFormSinceAtom,
  logsFormStdoutAtom,
  logsShowLogsAtom,
} from '../../src/common/store/atoms'

// Helper component to expose atom values into the DOM for assertions
function AtomReader() {
  const sid = useAtomValue(logsFormServiceIdAtom)
  const tail = useAtomValue(logsFormTailAtom)
  const since = useAtomValue(logsFormSinceAtom)
  const stdout = useAtomValue(logsFormStdoutAtom)
  return (
    <div>
      <div data-testid="atom-sid">{sid}</div>
      <div data-testid="atom-tail">{tail}</div>
      <div data-testid="atom-since">{since}</div>
      <div data-testid="atom-stdout">{String(stdout)}</div>
    </div>
  )
}

test('hideLogs preserves persisted form atom values', async () => {
  const { Suspense, useEffect } = React

  // Setup component to programmatically set atoms on mount
  function SetupSetter() {
    const [, setSid] = useAtom(logsFormServiceIdAtom)
    const [, setTail] = useAtom(logsFormTailAtom)
    const [, setSince] = useAtom(logsFormSinceAtom)
    const [, setStdout] = useAtom(logsFormStdoutAtom)
    const [, setShow] = useAtom(logsShowLogsAtom)
    useEffect(() => {
      setSid('svc-test')
      setTail('50')
      setSince('2h')
      setStdout(false)
      setShow(true)
    }, [])
    return null
  }

  // Create a small invoker component that performs the same actions as
  // LogsComponent.hideLogs() but without rendering the full LogsComponent
  // (avoids Suspense from async atoms used elsewhere).
  function HideInvoker() {
    // import atoms via require to avoid circular import issues with the test runner
    const atoms = require('../../src/common/store/atoms')
    const [, setLogsConfig] = useAtom(atoms.logsConfigAtom)
    const [, setLogsShow] = useAtom(atoms.logsShowLogsAtom)
    const resetLines = useResetAtom(atoms.logsLinesAtom)
    return (
      <button
        onClick={() => {
          resetLines()
          setLogsConfig(null)
          setLogsShow(false)
        }}
      >
        Invoke hide
      </button>
    )
  }

  render(
    <Provider>
      <Suspense fallback={<div>loading</div>}>
        <SetupSetter />
        <HideInvoker />
        <AtomReader />
      </Suspense>
    </Provider>,
  )

  const invoker = screen.getByText('Invoke hide')
  fireEvent.click(invoker)

  // After invoking hide, the atom values should still be present in AtomReader
  expect(screen.getByTestId('atom-sid').textContent).toBe('svc-test')
  expect(screen.getByTestId('atom-tail').textContent).toBe('50')
  expect(screen.getByTestId('atom-since').textContent).toBe('2h')
  expect(screen.getByTestId('atom-stdout').textContent).toBe('false')
})
