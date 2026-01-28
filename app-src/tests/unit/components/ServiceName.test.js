import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'jotai'
import * as atoms from '../../../src/common/store/atoms'

describe('ServiceName and NameActions logs button', () => {
  test('NameActions exposes logs button and calls onLogs', () => {
    const NameActions = require('../../../src/components/names/NameActions')
      .NameActions
    const onLogs = jest.fn()
    render(
      React.createElement(NameActions, {
        name: 'svcX',
        id: 'idX',
        showOpen: false,
        showFilter: false,
        showLogs: true,
        onLogs,
      }),
    )
    const logsBtn = screen.getByTitle('Show logs for service: svcX')
    fireEvent.click(logsBtn)
    expect(onLogs).toHaveBeenCalledWith('idX')
  })

  test('ServiceName clicking logs sets logs atoms and updates view', async () => {
    const ServiceName = require('../../../src/components/names/ServiceName')
      .ServiceName

    const initial = [
      [atoms.logsShowLogsAtom, false],
      [atoms.logsConfigAtom, null],
      [atoms.logsFormServiceIdAtom, ''],
      [atoms.logsFormServiceNameAtom, ''],
      [atoms.logsNumberOfLinesAtom, 0],
      [atoms.viewAtom, {}],
    ]

    // Render ServiceName together with an inline Checker component that reads
    // the atoms via hooks so we can assert their values after the click.
    const { useAtomValue } = require('jotai')
    function Checker() {
      const show = useAtomValue(atoms.logsShowLogsAtom)
      const cfg = useAtomValue(atoms.logsConfigAtom)
      const fid = useAtomValue(atoms.logsFormServiceIdAtom)
      const v = useAtomValue(atoms.viewAtom)
      return (
        <div>
          <span data-testid="show">{String(show)}</span>
          <span data-testid="cfg">{cfg ? cfg.serviceId : ''}</span>
          <span data-testid="fid">{fid}</span>
          <span data-testid="view">{v?.id || ''}</span>
        </div>
      )
    }

    const { container, getByTestId } = render(
      <Provider initialValues={initial}>
        <ServiceName name="my-svc" id="svc-1" />
        <Checker />
      </Provider>,
    )

    // logs button should be present (EntityName default showLogs=true)
    const logsBtn = screen.getByTitle('Show logs for service: my-svc')
    fireEvent.click(logsBtn)

    // Assert atom-driven outputs: form is prefilled, but live logs are not started
    expect(getByTestId('show').textContent).toBe('false')
    expect(getByTestId('cfg').textContent).toBe('')
    expect(getByTestId('fid').textContent).toBe('svc-1')
    expect(getByTestId('view').textContent).toBe('logs')
  })
})
