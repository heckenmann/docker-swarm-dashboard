// fetch_atoms.test.js
// Test async atoms that perform fetch calls by mocking fetch and jotai atom identity
jest.mock('jotai', () => ({ atom: (v) => v }))
jest.mock('jotai/utils', () => ({ atomWithReducer: (v) => v, atomWithReset: (v) => v, selectAtom: (a) => a }))
jest.mock('jotai-location', () => ({ atomWithHash: (k, def) => def }))

describe('fetch-based atoms', () => {
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

  test('portsAtom calls fetch with expected path', async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ ports: [] }) })
    const atoms = require('../../../src/common/store/atoms')
    const get = (req) => {
      if (req === atoms.baseUrlAtom) return '/'
      if (req === atoms.viewAtom) return {}
      return null
    }
    const res = await atoms.portsAtom(get)
    expect(res).toEqual({ ports: [] })
    expect(global.fetch).toHaveBeenCalledWith('/ui/ports')
  })

  test('nodesAtomNew calls fetch with expected path', async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ nodes: [] }) })
    const atoms = require('../../../src/common/store/atoms')
    const get = (req) => {
      if (req === atoms.baseUrlAtom) return '/'
      if (req === atoms.viewAtom) return {}
      return null
    }
    const res = await atoms.nodesAtomNew(get)
    expect(res).toEqual({ nodes: [] })
    expect(global.fetch).toHaveBeenCalledWith('/ui/nodes')
  })

  test('tasksAtomNew calls fetch with expected path', async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ tasks: [] }) })
    const atoms = require('../../../src/common/store/atoms')
    const get = (req) => {
      if (req === atoms.baseUrlAtom) return '/'
      if (req === atoms.viewAtom) return {}
      return null
    }
    const res = await atoms.tasksAtomNew(get)
    expect(res).toEqual({ tasks: [] })
    expect(global.fetch).toHaveBeenCalledWith('/ui/tasks')
  })

  test('nodeDetailAtom calls fetch with docker nodes path using view.detail', async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ node: {} }) })
    const atoms = require('../../../src/common/store/atoms')
    const get = (req) => {
      if (req === atoms.baseUrlAtom) return '/'
      if (req === atoms.viewAtom) return { detail: 'node123' }
      return null
    }
    const res = await atoms.nodeDetailAtom(get)
    expect(res).toEqual({ node: {} })
    expect(global.fetch).toHaveBeenCalledWith('/docker/nodes/node123')
  })

  test('logsServicesAtom calls fetch with expected path', async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ services: [] }) })
    const atoms = require('../../../src/common/store/atoms')
    const get = (req) => {
      if (req === atoms.baseUrlAtom) return '/'
      if (req === atoms.viewAtom) return {}
      return null
    }
    const res = await atoms.logsServicesAtom(get)
    expect(res).toEqual({ services: [] })
    expect(global.fetch).toHaveBeenCalledWith('/ui/logs/services')
  })

  test('serviceDetailAtom calls fetch with docker services path using view.detail', async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ service: {} }) })
    const atoms = require('../../../src/common/store/atoms')
    const get = (req) => {
      if (req === atoms.baseUrlAtom) return '/'
      if (req === atoms.viewAtom) return { detail: 'svc1' }
      return null
    }
    const res = await atoms.serviceDetailAtom(get)
    expect(res).toEqual({ service: {} })
    expect(global.fetch).toHaveBeenCalledWith('/docker/services/svc1')
  })

  test('taskDetailAtom calls fetch with docker tasks path using view.detail', async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ task: {} }) })
    const atoms = require('../../../src/common/store/atoms')
    const get = (req) => {
      if (req === atoms.baseUrlAtom) return '/'
      if (req === atoms.viewAtom) return { detail: 'task99' }
      return null
    }
    const res = await atoms.taskDetailAtom(get)
    expect(res).toEqual({ task: {} })
    expect(global.fetch).toHaveBeenCalledWith('/docker/tasks/task99')
  })

  test('timelineAtom calls fetch and returns json', async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ timeline: [] }) })
    const atoms = require('../../../src/common/store/atoms')
    const get = (req) => {
      if (req === atoms.baseUrlAtom) return '/'
      if (req === atoms.viewAtom) return {}
      return null
    }
    const res = await atoms.timelineAtom(get)
    expect(res).toEqual({ timeline: [] })
    expect(global.fetch).toHaveBeenCalledWith('/ui/timeline')
  })

  test('dashboardSettingsAtom and versionAtom call fetch with expected paths', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ json: async () => ({ defaultLayout: 'row' }) })
      .mockResolvedValueOnce({ json: async () => ({ version: '1.2.3' }) })
    const atoms = require('../../../src/common/store/atoms')
    const get = (req) => {
      if (req === atoms.baseUrlAtom) return '/'
      return null
    }
    const settings = await atoms.dashboardSettingsAtom(get)
    const ver = await atoms.versionAtom(get)
    expect(settings).toEqual({ defaultLayout: 'row' })
    expect(ver).toEqual({ version: '1.2.3' })
    expect(global.fetch).toHaveBeenNthCalledWith(1, '/ui/dashboard-settings')
    expect(global.fetch).toHaveBeenNthCalledWith(2, '/ui/version')
  })
})
