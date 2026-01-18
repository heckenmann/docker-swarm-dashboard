// fetch_atoms_even_more.test.js
// Additional fetch-based atom tests: node/service/task detail, logs services and timeline
jest.mock('jotai', () => ({ atom: (v) => v }))
jest.mock('jotai/utils', () => ({ atomWithReducer: (v) => v, atomWithReset: (v) => v, selectAtom: (a) => a }))
jest.mock('jotai-location', () => ({ atomWithHash: (k, def) => def }))

describe('additional fetch atoms', () => {
  const realFetch = global.fetch
  afterEach(() => {
    global.fetch = realFetch
    jest.resetModules()
  })

  test('nodeDetailAtom/serviceDetailAtom/taskDetailAtom use detail id and fetch', async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ item: true }) })
    const atoms = require('../../../src/common/store/atoms')
    const get = (req) => {
      if (req === atoms.baseUrlAtom) return '/'
      if (req === atoms.viewAtom) return { detail: '42' }
      return null
    }
    const node = await atoms.nodeDetailAtom(get)
    const svc = await atoms.serviceDetailAtom(get)
    const task = await atoms.taskDetailAtom(get)
    expect(node).toEqual({ item: true })
    expect(svc).toEqual({ item: true })
    expect(task).toEqual({ item: true })
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })

  test('logsServicesAtom and timelineAtom call fetch', async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ ok: true }) })
    const atoms = require('../../../src/common/store/atoms')
    const get = (req) => {
      if (req === atoms.baseUrlAtom) return '/app/'
      if (req === atoms.viewAtom) return {}
      return null
    }
    const logs = await atoms.logsServicesAtom(get)
    const tl = await atoms.timelineAtom(get)
    expect(logs).toEqual({ ok: true })
    expect(tl).toEqual({ ok: true })
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })
})
