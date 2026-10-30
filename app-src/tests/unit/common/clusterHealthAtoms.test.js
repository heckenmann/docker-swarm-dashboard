import { createStore } from 'jotai'
import {
  clusterHealthAtom,
  nodesAtomNew,
} from '../../../src/common/store/atoms/dashboardAtoms'
import { baseUrlAtom } from '../../../src/common/store/atoms/foundationAtoms'
import { viewAtom } from '../../../src/common/store/atoms/navigationAtoms'

const originalFetch = global.fetch
let store
beforeEach(() => {
  store = createStore()
  store.set(baseUrlAtom, '/test/')
  global.fetch = jest.fn()
})
afterEach(() => {
  global.fetch = originalFetch
})

test('loads the shared health response and invalidates on refresh', async () => {
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ available: true, remainingFailures: 1 }),
  })
  expect(await store.get(clusterHealthAtom)).toEqual({
    available: true,
    remainingFailures: 1,
  })
  expect(global.fetch).toHaveBeenCalledWith('/test/docker/cluster/health')
  global.fetch.mockResolvedValue({
    ok: false,
    status: 503,
    json: async () => ({ available: false, state: 'unavailable' }),
  })
  store.set(viewAtom, { id: 'nodes', updated: 1 })
  expect(await store.get(clusterHealthAtom)).toEqual({
    available: false,
    state: 'unavailable',
  })
})

test('rejects unexpected HTTP errors without interpreting them as observations', async () => {
  global.fetch.mockResolvedValue({ ok: false, status: 502 })
  await expect(store.get(clusterHealthAtom)).rejects.toThrow(
    'Failed to fetch control-plane information',
  )
})

test('reports transport failure', async () => {
  global.fetch.mockRejectedValue(new Error('offline'))
  await expect(store.get(clusterHealthAtom)).rejects.toThrow('offline')
})

test('loads inventory and reports HTTP failures locally', async () => {
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => [{ ID: 'node' }],
  })
  expect(await store.get(nodesAtomNew)).toEqual([{ ID: 'node' }])
  global.fetch.mockResolvedValue({ ok: false, status: 500 })
  store.set(viewAtom, { id: 'nodes', updated: 2 })
  await expect(store.get(nodesAtomNew)).rejects.toThrow('Failed to fetch nodes')
})
