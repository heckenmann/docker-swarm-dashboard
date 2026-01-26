// Combined fetch_atoms tests
// Merges previous fetch_atoms.* fragments into one consolidated file.
jest.mock('jotai', () => ({ atom: (v) => v }))
jest.mock('jotai/utils', () => ({
  atomWithReducer: (v) => v,
  atomWithReset: (v) => v,
  selectAtom: (a) => a,
}))
jest.mock('jotai-location', () => ({ atomWithHash: (k, def) => def }))

describe('fetch-based atoms (combined)', () => {
  const realFetch = global.fetch
  afterEach(() => {
    global.fetch = realFetch
    jest.resetModules()
  })

  test('dashboardHAtom calls fetch with relative base and returns json', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ json: async () => ({ dh: 1 }) })
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
    global.fetch = jest
      .fn()
      .mockResolvedValue({ json: async () => ({ dv: 2 }) })
    const atoms = require('../../../src/common/store/atoms')
    const get = (req) => {
      if (req === atoms.baseUrlAtom) return 'https://example.com/base/'
      if (req === atoms.viewAtom) return {}
      return null
    }
    const res = await atoms.dashboardVAtom(get)
    expect(res).toEqual({ dv: 2 })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/base/ui/dashboardv',
    )
  })

  test('stacksAtom calls fetch and returns json', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ json: async () => ({ stacks: [] }) })
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
    global.fetch = jest
      .fn()
      .mockResolvedValue({ json: async () => ({ ports: [] }) })
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
    global.fetch = jest
      .fn()
      .mockResolvedValue({ json: async () => ({ ok: true }) })
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
    global.fetch = jest
      .fn()
      .mockResolvedValue({ json: async () => ({ v: '1.2.3' }) })
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

  test('parseHash fallback and module-load parsedHash behavior', async () => {
    // simulate a hash that contains a quoted base; require atoms module and check baseUrlAtom default
    const origHash = window.location.hash
    window.location.hash = '#base="http%3A%2F%2Fexample.mock%2Fapi%2F"'
    jest.resetModules()
    const atoms = require('../../../src/common/store/atoms')
    // baseUrlAtom is defined via atomWithHash; at least the parsed hash was consumed during module load
    expect(atoms.baseUrlAtom).toBeDefined()
    window.location.hash = origHash
  })

  test('nodeDetailAtom/serviceDetailAtom/taskDetailAtom use detail id and fetch', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ json: async () => ({ item: true }) })
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
    currentView = {
      id: atoms.servicesDetailId || 'servicesDetail',
      detail: '42',
    }
    const svc = await atoms.serviceDetailAtom(get)
    // task detail
    currentView = { id: atoms.tasksId || 'tasks', detail: '42' }
    const task = await atoms.taskDetailAtom(get)
    expect(node).toEqual({ item: true })
    expect(svc).toEqual({ item: true })
    expect(task).toEqual({ item: true })
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })

  test('serviceDetailAtom and taskDetailAtom fetch when view.id matches navigation constants', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ json: async () => ({ ok: true }) })
    const atoms = require('../../../src/common/store/atoms')
    const nav = require('../../../src/common/navigationConstants')

    // service detail
    const getSvc = (req) => {
      if (req === atoms.viewAtom)
        return { id: nav.servicesDetailId, detail: 'svc-123' }
      if (req === atoms.baseUrlAtom) return '/'
      return null
    }
    const svcRes = await atoms.serviceDetailAtom(getSvc)
    expect(svcRes).toEqual({ ok: true })

    // task detail
    const getTask = (req) => {
      if (req === atoms.viewAtom) return { id: nav.tasksId, detail: 'task-9' }
      if (req === atoms.baseUrlAtom) return '/'
      return null
    }
    const taskRes = await atoms.taskDetailAtom(getTask)
    expect(taskRes).toEqual({ ok: true })
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  test('logsServicesAtom and timelineAtom call fetch', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ json: async () => ({ ok: true }) })
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

  test('detail atoms early-return and fetch when view.id matches navigation ids', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ json: async () => ({ ok: true }) })
    const atoms = require('../../../src/common/store/atoms')
    const nav = require('../../../src/common/navigationConstants')

    // mismatch view id -> nodeDetailAtom returns null
    const getMismatch = (req) =>
      req === atoms.viewAtom ? { id: 'other' } : '/'
    expect(await atoms.nodeDetailAtom(getMismatch)).toBeNull()

    // matching service detail -> fetch invoked
    const getSvc = (req) => {
      if (req === atoms.viewAtom)
        return { id: nav.servicesDetailId, detail: 'svc-7' }
      if (req === atoms.baseUrlAtom) return '/'
      return null
    }
    const svc = await atoms.serviceDetailAtom(getSvc)
    expect(svc).toEqual({ ok: true })

    // matching task detail -> fetch invoked
    const getTask = (req) => {
      if (req === atoms.viewAtom) return { id: nav.tasksId, detail: 't-9' }
      if (req === atoms.baseUrlAtom) return '/'
      return null
    }
    const t = await atoms.taskDetailAtom(getTask)
    expect(t).toEqual({ ok: true })
  })
})
