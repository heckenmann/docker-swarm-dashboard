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
})
