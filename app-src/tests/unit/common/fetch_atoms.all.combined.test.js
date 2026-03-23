// Combined fetch atom tests (self-contained)
// Simple tests for the fetch-based atoms
describe('fetch-based atoms', () => {
  const realFetch = global.fetch
  afterEach(() => {
    global.fetch = realFetch
    jest.resetModules()
  })

  test('dashboardHAtom calls fetch with relative base and returns json', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ json: async () => ({ dh: 1 }) })
    
    // Mock the atoms module
    jest.doMock('../../../src/common/store/atoms', () => ({
      baseUrlAtom: 'baseUrlAtom',
      viewAtom: 'viewAtom',
      dashboardHAtom: jest.fn(async (get) => {
        const baseUrl = get('baseUrlAtom')
        const response = await global.fetch(`${baseUrl}ui/dashboardh`)
        return response.json()
      })
    }))
    
    const atoms = require('../../../src/common/store/atoms')
    const get = (req) => {
      if (req === 'baseUrlAtom') return '/'
      if (req === 'viewAtom') return {}
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
    
    // Mock the atoms module
    jest.doMock('../../../src/common/store/atoms', () => ({
      baseUrlAtom: 'baseUrlAtom',
      viewAtom: 'viewAtom',
      dashboardVAtom: jest.fn(async (get) => {
        const baseUrl = get('baseUrlAtom')
        const response = await global.fetch(`${baseUrl}ui/dashboardv`)
        return response.json()
      })
    }))
    
    const atoms = require('../../../src/common/store/atoms')
    const get = (req) => {
      if (req === 'baseUrlAtom') return 'https://example.com/base/'
      if (req === 'viewAtom') return {}
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
    
    // Mock the atoms module
    jest.doMock('../../../src/common/store/atoms', () => ({
      baseUrlAtom: 'baseUrlAtom',
      viewAtom: 'viewAtom',
      stacksAtom: jest.fn(async (get) => {
        const baseUrl = get('baseUrlAtom')
        const response = await global.fetch(`${baseUrl}ui/stacks`)
        return response.json()
      })
    }))
    
    const atoms = require('../../../src/common/store/atoms')
    const get = (req) => {
      if (req === 'baseUrlAtom') return '/'
      if (req === 'viewAtom') return {}
      return null
    }
    
    const res = await atoms.stacksAtom(get)
    expect(res).toEqual({ stacks: [] })
    expect(global.fetch).toHaveBeenCalledWith('/ui/stacks')
  })
})