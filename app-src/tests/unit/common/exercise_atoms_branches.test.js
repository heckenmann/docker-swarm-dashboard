// Broad exercise test to touch many branches in atoms.js
jest.mock('jotai', () => ({ atom: (v) => v }))
jest.mock('jotai/utils', () => ({ atomWithReducer: (v) => v, atomWithReset: (v) => v, selectAtom: (a) => a }))
jest.mock('jotai-location', () => ({ atomWithHash: (k, def) => def }))

describe('exercise many atoms to increase branch coverage', () => {
  const realFetch = global.fetch
  afterEach(() => {
    global.fetch = realFetch
    jest.resetModules()
  })

  test('call common atoms with various view states', async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ ok: true, item: true }) })
    const atoms = require('../../../src/common/store/atoms')

    // common get returning baseUrl and empty view
    const getBase = (req) => {
      if (req === atoms.baseUrlAtom) return '/'
      if (req === atoms.viewAtom) return {}
      return null
    }

    // call several atoms that should fetch
    await atoms.dashboardHAtom(getBase)
    await atoms.dashboardVAtom(getBase)
    await atoms.stacksAtom(getBase)
    await atoms.portsAtom(getBase)
    await atoms.nodesAtomNew(getBase)
    await atoms.tasksAtomNew(getBase)
    await atoms.logsServicesAtom(getBase)
    await atoms.timelineAtom(getBase)

    // nodeDetailAtom returns null when view id mismatches
    const getNodeMismatch = (req) => {
      if (req === atoms.baseUrlAtom) return '/'
      if (req === atoms.viewAtom) return { id: 'servicesDetail', detail: 'x' }
      return null
    }
    expect(await atoms.nodeDetailAtom(getNodeMismatch)).toBeNull()

    // now valid node detail fetch
    const getNodeMatch = (req) => {
      if (req === atoms.baseUrlAtom) return '/'
      if (req === atoms.viewAtom) return { id: 'nodesDetail', detail: 'x' }
      return null
    }
    expect(await atoms.nodeDetailAtom(getNodeMatch)).toEqual({ ok: true, item: true })

    // service detail
    const getSvcMatch = (req) => {
      if (req === atoms.baseUrlAtom) return '/'
      if (req === atoms.viewAtom) return { id: 'servicesDetail', detail: 's1' }
      return null
    }
    expect(await atoms.serviceDetailAtom(getSvcMatch)).toEqual({ ok: true, item: true })

    // task detail
    const getTaskMatch = (req) => {
      if (req === atoms.baseUrlAtom) return '/'
      if (req === atoms.viewAtom) return { id: 'tasks', detail: 't1' }
      return null
    }
    expect(await atoms.taskDetailAtom(getTaskMatch)).toEqual({ ok: true, item: true })

    // logsWebsocketUrlAtom with logsConfig present and relative base
    const getLogs = (req) => {
      if (req === atoms.logsConfigAtom) return { serviceId: 's1', tail: '1', since: '0', follow: 'false', timestamps: 'false', stdout: 'true', stderr: 'false', details: 'false' }
      if (req === atoms.baseUrlAtom) return '/app/'
      if (req === atoms.isDarkModeAtom) return false
      return null
    }
    const url = atoms.logsWebsocketUrlAtom(getLogs)
    expect(typeof url).toBe('string')
  })
})
