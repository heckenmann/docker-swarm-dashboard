import { createStore } from 'jotai/vanilla'
import { nodeMetricsAtomFamily } from '../../../src/common/store/atoms/dashboardAtoms'
import { baseUrlAtom } from '../../../src/common/store/atoms/foundationAtoms'
import { viewAtom } from '../../../src/common/store/atoms/navigationAtoms'

// Use the real store and atom family to exercise cached async dependencies.
describe('node metrics refresh', () => {
  let store
  let metricsAtom
  let response
  let subscriptions
  const originalFetch = global.fetch

  beforeEach(() => {
    window.history.replaceState(null, '', '/')
    store = createStore()
    store.set(baseUrlAtom, '/dashboard/')
    store.set(viewAtom, { id: 'nodes', timestamp: 1 })
    metricsAtom = nodeMetricsAtomFamily('node-refresh')
    subscriptions = []
    response = { available: true, metrics: { memory: { available: 10 } } }
    global.fetch = jest.fn(async () => ({ json: async () => response }))
  })

  afterEach(() => {
    subscriptions.forEach((unsubscribe) => unsubscribe())
    global.fetch = originalFetch
    window.history.replaceState(null, '', '/')
  })

  test('manual and automatic refresh retrieve new metrics on the same view', async () => {
    subscriptions.push(store.sub(metricsAtom, () => {}))
    expect(await store.get(metricsAtom)).toEqual(response)
    for (const timestamp of [2, 3]) {
      response = {
        available: true,
        metrics: { memory: { available: timestamp * 10 } },
      }
      store.set(viewAtom, { id: 'nodes', timestamp })
      expect(await store.get(metricsAtom)).toEqual(response)
      expect(global.fetch).toHaveBeenCalledTimes(timestamp)
    }
    expect(global.fetch).toHaveBeenLastCalledWith(
      '/dashboard/docker/nodes/node-refresh/metrics',
    )
  })

  test('memory and disk consumers share one request per refresh', async () => {
    const diskAtom = nodeMetricsAtomFamily('node-refresh')
    expect(diskAtom).toBe(metricsAtom)
    subscriptions.push(store.sub(metricsAtom, () => {}))
    subscriptions.push(store.sub(diskAtom, () => {}))
    await Promise.all([store.get(metricsAtom), store.get(diskAtom)])
    expect(global.fetch).toHaveBeenCalledTimes(1)
    store.set(viewAtom, { id: 'nodes', timestamp: 2 })
    await Promise.all([store.get(metricsAtom), store.get(diskAtom)])
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  test('an unavailable result recovers on refresh', async () => {
    response = { available: false }
    subscriptions.push(store.sub(metricsAtom, () => {}))
    expect(await store.get(metricsAtom)).toEqual({ available: false })
    response = { available: true, metrics: { memory: { available: 20 } } }
    store.set(viewAtom, { id: 'nodes', timestamp: 2 })
    expect(await store.get(metricsAtom)).toEqual(response)
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  test('navigation and remount invalidate the cached family result', async () => {
    const unsubscribe = store.sub(metricsAtom, () => {})
    expect(await store.get(metricsAtom)).toEqual(response)
    unsubscribe()
    store.set(viewAtom, { id: 'services', timestamp: 2 })
    response = { available: true, metrics: { memory: { available: 30 } } }
    store.set(viewAtom, { id: 'nodes', timestamp: 3 })
    subscriptions.push(store.sub(metricsAtom, () => {}))
    expect(await store.get(metricsAtom)).toEqual(response)
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  test('a failed fetch recovers on the next refresh', async () => {
    global.fetch.mockRejectedValueOnce(new Error('temporary network failure'))
    subscriptions.push(store.sub(metricsAtom, () => {}))
    expect(await store.get(metricsAtom)).toEqual({ available: false })
    store.set(viewAtom, { id: 'nodes', timestamp: 2 })
    expect(await store.get(metricsAtom)).toEqual(response)
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  test('an older response cannot overwrite refreshed metrics', async () => {
    let finishInitial
    const initialResponse = response
    global.fetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishInitial = resolve
        }),
    )
    subscriptions.push(store.sub(metricsAtom, () => {}))
    const pendingInitial = store.get(metricsAtom)
    response = { available: true, metrics: { memory: { available: 40 } } }
    store.set(viewAtom, { id: 'nodes', timestamp: 2 })
    expect(await store.get(metricsAtom)).toEqual(response)
    finishInitial({ json: async () => initialResponse })
    await pendingInitial
    expect(await store.get(metricsAtom)).toEqual(response)
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })
})
