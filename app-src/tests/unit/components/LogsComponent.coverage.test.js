import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'jotai'

// Mock atoms similarly to the combined test so the component doesn't suspend
jest.mock('../../../src/common/store/atoms', () => {
  const real = jest.requireActual('../../../src/common/store/atoms')
  const { atom: jotaiAtom } = require('jotai')
  return {
    ...real,
    // Provide concrete defaults so tests in this file render without suspension
    logsServicesAtom: jotaiAtom([{ ID: 's1', Name: 'svc' }]),
    logsNumberOfLinesAtom: jotaiAtom(5),
  }
})

import * as atoms from '../../../src/common/store/atoms'
import { Suspense } from 'react'

const modLogs = require('../../../src/components/LogsComponent')
const LogsComponent = modLogs.LogsComponent || modLogs.default || modLogs

describe('LogsComponent coverage additions', () => {
  test('renders service option when services provided', async () => {
    render(
      <Suspense fallback={<div>loading</div>}>
        <Provider
          initialValues={[[atoms.logsServicesAtom, [{ ID: 's1', Name: 'svc' }]]]}>
          <LogsComponent />
        </Provider>
      </Suspense>,
    )

    // wait for the form to render and the option to be present
    await waitFor(() => expect(screen.getByRole('button', { name: /Show logs/i })).toBeInTheDocument())
    const option = screen.getByText('svc')
    expect(option).toBeInTheDocument()
    expect(option).toHaveAttribute('value', 's1')
  })

  test('changing number-of-lines input updates controlled input', async () => {
    const { container } = render(
      <Suspense fallback={<div>loading</div>}>
        <Provider
          initialValues={[
            [atoms.logsServicesAtom, [{ ID: 's1', Name: 'svc' }]],
            [atoms.logsNumberOfLinesAtom, 5],
          ]}
        >
          <LogsComponent />
        </Provider>
      </Suspense>,
    )

    // wait for form, set tail to 5 and submit to show printer options
    await waitFor(() => expect(screen.getByRole('button', { name: /Show logs/i })).toBeInTheDocument())
    const tailInput = screen.getByDisplayValue('20')
    fireEvent.change(tailInput, { target: { value: '5' } })
    fireEvent.submit(container.querySelector('form'))

    // find the input rendered inside the printer options and change it
    const input = await screen.findByDisplayValue('5')
    fireEvent.change(input, { target: { value: '3' } })

    // controlled input should reflect the change
    await waitFor(() => expect(screen.getByDisplayValue('3')).toBeInTheDocument())
  })
})
