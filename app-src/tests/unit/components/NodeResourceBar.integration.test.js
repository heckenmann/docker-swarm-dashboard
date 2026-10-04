import React from 'react'
import { act, render, screen } from '@testing-library/react'
import { Provider, createStore } from 'jotai'
import NodeResourceBar from '../../../src/components/nodes/NodeResourceBar'

jest.mock('../../../src/common/store/atoms/dashboardAtoms', () => {
  const { atom } = jest.requireActual('jotai')
  const { atomFamily } = jest.requireActual('jotai-family')
  return {
    nodeMetricsAtomFamily: atomFamily((id) =>
      atom(async () => (await fetch(`/metrics/${id}`)).json()),
    ),
  }
})

test('shares an async node request across resource bars and switches nodes without stale data', async () => {
  const store = createStore()
  let resolve
  const request = new Promise((done) => {
    resolve = done
  })
  const fetchSpy = jest
    .spyOn(global, 'fetch')
    .mockReturnValueOnce(request)
    .mockResolvedValueOnce({ json: async () => ({ available: false }) })
  const bars = (nodeId) => (
    <Provider store={store}>
      <NodeResourceBar nodeId={nodeId} type="memory" />
      <NodeResourceBar nodeId={nodeId} type="disk" />
    </Provider>
  )
  try {
    const { rerender } = render(bars('integration-node-1'))
    expect(screen.getAllByRole('status')).toHaveLength(2)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    await act(async () =>
      resolve({
        json: async () => ({
          available: true,
          metrics: {
            memory: { total: 100, available: 50 },
            filesystem: [{ mountpoint: '/', size: 100, used: 25 }],
          },
        }),
      }),
    )
    expect(await screen.findAllByRole('progressbar')).toHaveLength(2)
    rerender(bars('integration-node-1'))
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    rerender(bars('integration-node-2'))
    expect(await screen.findAllByText('N/A')).toHaveLength(2)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(fetchSpy).toHaveBeenLastCalledWith('/metrics/integration-node-2')
  } finally {
    fetchSpy.mockRestore()
  }
})
