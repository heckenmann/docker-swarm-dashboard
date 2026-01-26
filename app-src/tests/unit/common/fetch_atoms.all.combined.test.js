// Combined fetch atom tests (self-contained)
jest.mock('jotai', () => ({ atom: (v) => v }))
jest.mock('jotai/utils', () => ({ atomWithReducer: (v) => v, atomWithReset: (v) => v, selectAtom: (a) => a }))
jest.mock('jotai-location', () => ({ atomWithHash: (k, def) => def }))

describe('fetch-based atoms (all combined)', () => {
  const realFetch = global.fetch
  afterEach(() => {
    global.fetch = realFetch
    jest.resetModules()
  })

  test('dashboardHAtom calls fetch with relative base and returns json', async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ dh: 1 }) })
    const atoms = require('../../../src/common/store/atoms')
    const get = (req) => {
      if (req === atoms.baseUrlAtom) return '/'
      if (req === atoms.viewAtom) return {}
      return null
    }
    const res = await atoms.dashboardHAtom(get)
    expect(res).toEqual({ dh: 1 })
    expect(global.fetch).toHaveBeenCalledWith('/ui/dashboardh')
  })

  test('dashboardVAtom calls fetch with absolute base and returns json', async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ dv: 2 }) })
    const atoms = require('../../../src/common/store/atoms')
    const get = (req) => {
      if (req === atoms.baseUrlAtom) return 'https://example.com/base/'
      if (req === atoms.viewAtom) return {}
      return null
    }
    const res = await atoms.dashboardVAtom(get)
    expect(res).toEqual({ dv: 2 })
    expect(global.fetch).toHaveBeenCalledWith('https://example.com/base/ui/dashboardv')
  })

  test('stacksAtom calls fetch and returns json', async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ stacks: [] }) })
    const atoms = require('../../../src/common/store/atoms')
    const get = (req) => {
      if (req === atoms.baseUrlAtom) return '/app/'
      if (req === atoms.viewAtom) return {}
      return null
    }
    const res = await atoms.stacksAtom(get)
    expect(res).toEqual({ stacks: [] })
    expect(global.fetch).toHaveBeenCalledWith('/app/ui/stacks')
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

  test('nodeDetailAtom/serviceDetailAtom/taskDetailAtom use detail id and fetch', async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ item: true }) })
    const atoms = require('../../../src/common/store/atoms')
    let currentView = { id: atoms.nodesDetailId || 'nodesDetail', detail: '42' }
    const get = (req) => {
      if (req === atoms.baseUrlAtom) return '/'
      if (req === atoms.viewAtom) return currentView
      return null
    }
    // node detail
    currentView = { id: atoms.nodesDetailId || 'nodesDetail', detail: '42' }
    const node = await atoms.nodeDetailAtom(get)
    // service detail
    currentView = { id: atoms.servicesDetailId || 'servicesDetail', detail: '42' }
    const svc = await atoms.serviceDetailAtom(get)
    // task detail
    currentView = { id: atoms.tasksId || 'tasks', detail: '42' }
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
