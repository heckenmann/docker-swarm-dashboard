// fetch_atoms_more.test.js
// Exercise more fetch-based atoms and error handling: ports, nodes, tasks, version and dashboard settings error path
jest.mock('jotai', () => ({ atom: (v) => v }))
jest.mock('jotai/utils', () => ({ atomWithReducer: (v) => v, atomWithReset: (v) => v, selectAtom: (a) => a }))
jest.mock('jotai-location', () => ({ atomWithHash: (k, def) => def }))

describe('more fetch-based atoms', () => {
  const realFetch = global.fetch
  afterEach(() => {
    global.fetch = realFetch
    jest.resetModules()
  })

  test('portsAtom calls fetch and returns json', async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ ports: [] }) })
    const atoms = require('../../../src/common/store/atoms')
    const get = (req) => {
      if (req === atoms.baseUrlAtom) return '/api/'
      if (req === atoms.viewAtom) return {}
      return null
    }
    const res = await atoms.portsAtom(get)
    expect(res).toEqual({ ports: [] })
    expect(global.fetch).toHaveBeenCalledWith('/api/ui/ports')
  })

  test('nodesAtomNew and tasksAtomNew call fetch', async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ ok: true }) })
    const atoms = require('../../../src/common/store/atoms')
    const get = (req) => {
      if (req === atoms.baseUrlAtom) return '/'
      if (req === atoms.viewAtom) return {}
      return null
    }
    const nodes = await atoms.nodesAtomNew(get)
    const tasks = await atoms.tasksAtomNew(get)
    expect(nodes).toEqual({ ok: true })
    expect(tasks).toEqual({ ok: true })
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  test('versionAtom and dashboardSettingsDefaultLayoutViewIdAtom', async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ v: '1.2.3' }) })
    const atoms = require('../../../src/common/store/atoms')
    const get = (req) => {
      if (req === atoms.baseUrlAtom) return '/'
      if (req === atoms.dashboardSettingsAtom) return { defaultLayout: 'row' }
      return null
    }
    const ver = await atoms.versionAtom(get)
    const layoutId = await atoms.dashboardSettingsDefaultLayoutViewIdAtom(get)
    expect(ver).toEqual({ v: '1.2.3' })
    // dashboardSettingsDefaultLayoutViewIdAtom returns dashboardHId when defaultLayout === 'row'
    expect(typeof layoutId).toBe('string')
  })

  test('dashboardSettingsAtom fetch rejection propagates', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('fail'))
    const atoms = require('../../../src/common/store/atoms')
    const get = (req) => {
      if (req === atoms.baseUrlAtom) return '/'
      if (req === atoms.viewAtom) return {}
      return null
    }
    await expect(atoms.dashboardSettingsAtom(get)).rejects.toThrow('fail')
  })
})
