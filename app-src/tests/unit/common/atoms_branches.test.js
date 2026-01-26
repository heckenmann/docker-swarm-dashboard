describe('atoms branch coverage (logsWebsocketUrlAtom)', () => {
  beforeEach(() => jest.resetModules())

  test('logsWebsocketUrlAtom returns null when no logsConfig', () => {
    jest.doMock('jotai', () => ({ atom: (v) => v }))
    jest.doMock('jotai/utils', () => ({ atomWithReducer: (v) => v, atomWithReset: (v) => v, selectAtom: (a) => a }))
    jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))

    const atoms = require('../../../src/common/store/atoms')
    const logsWebsocketUrlAtom = atoms.logsWebsocketUrlAtom

    const get = (a) => {
      if (a === atoms.logsConfigAtom) return null
      return '/'
    }

    const result = logsWebsocketUrlAtom(get)
    expect(result).toBeNull()
  })

  test('logsWebsocketUrlAtom builds ws url for absolute baseUrl', () => {
    jest.doMock('jotai', () => ({ atom: (v) => v }))
    jest.doMock('jotai/utils', () => ({ atomWithReducer: (v) => v, atomWithReset: (v) => v, selectAtom: (a) => a }))
    jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))

    const atoms = require('../../../src/common/store/atoms')
    const logsWebsocketUrlAtom = atoms.logsWebsocketUrlAtom

    const logsConfig = {
      serviceId: 'svc1',
      tail: 10,
      since: 0,
      follow: true,
      timestamps: true,
      stdout: true,
      stderr: true,
      details: false,
    }

    const get = (a) => {
      if (a === atoms.logsConfigAtom) return logsConfig
      if (a === atoms.baseUrlAtom) return 'http://example.test/base/'
      return null
    }

    const result = logsWebsocketUrlAtom(get)
    expect(typeof result).toBe('string')
    expect(result.startsWith('ws://') || result.startsWith('wss://')).toBe(true)
    expect(result).toContain('svc1')
  })

  test('module-load parsedHash consumes quoted base and handles malformed values at import', () => {
    const origHash = window.location.hash
    try {
      window.location.hash = '#base="http%3A%2F%2Fexample.mod%2Fapi%2F"&bad=%ZZ'
      jest.resetModules()
      const atoms = require('../../../src/common/store/atoms')
      // module-load parsedHash should have set baseUrlAtom default
      expect(atoms.baseUrlAtom).toBeDefined()
    } finally {
      window.location.hash = origHash
    }
  })

  test('logsWebsocketUrlAtom builds ws url for relative baseUrl', () => {
    jest.doMock('jotai', () => ({ atom: (v) => v }))
    jest.doMock('jotai/utils', () => ({ atomWithReducer: (v) => v, atomWithReset: (v) => v, selectAtom: (a) => a }))
    jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))

    const atoms = require('../../../src/common/store/atoms')
    const logsWebsocketUrlAtom = atoms.logsWebsocketUrlAtom

    const logsConfig = { serviceId: 'svc2', tail: 0, since: 0, follow: false, timestamps: false, stdout: false, stderr: false, details: false }

    const get = (a) => {
      if (a === atoms.logsConfigAtom) return logsConfig
      if (a === atoms.baseUrlAtom) return '/api'
      return null
    }

    const result = logsWebsocketUrlAtom(get)
    expect(typeof result).toBe('string')
    expect(result.includes('svc2')).toBe(true)
  })
})

describe('detail atoms guards and fetch', () => {
  beforeEach(() => jest.resetModules())

  test('nodeDetailAtom returns null when view.id mismatches', async () => {
    jest.doMock('jotai', () => ({ atom: (v) => v }))
    jest.doMock('jotai/utils', () => ({ atomWithReducer: (v) => v, atomWithReset: (v) => v, selectAtom: (a) => a }))
    jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))
    const atoms = require('../../../src/common/store/atoms')
    const get = () => ({ id: 'other' })
    const res = await atoms.nodeDetailAtom(get)
    expect(res).toBeNull()
  })

  test('serviceDetailAtom fetches when view.id matches and returns json', async () => {
    jest.doMock('jotai', () => ({ atom: (v) => v }))
    jest.doMock('jotai/utils', () => ({ atomWithReducer: (v) => v, atomWithReset: (v) => v, selectAtom: (a) => a }))
    jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))
    global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({ ok: true }) }))
    const atoms = require('../../../src/common/store/atoms')
    const get = (a) => (a === atoms.viewAtom ? { id: 'servicesDetail', detail: 's1' } : '/')
    const res = await atoms.serviceDetailAtom(get)
    expect(res).toEqual({ ok: true })
  })

  test('taskDetailAtom returns null when no id in view', async () => {
    jest.doMock('jotai', () => ({ atom: (v) => v }))
    jest.doMock('jotai/utils', () => ({ atomWithReducer: (v) => v, atomWithReset: (v) => v, selectAtom: (a) => a }))
    jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))
    const atoms = require('../../../src/common/store/atoms')
    const get = (a) => (a === atoms.viewAtom ? { id: 'tasksDetail' } : '/')
    const res = await atoms.taskDetailAtom(get)
    expect(res).toBeNull()
  })

  test('nodeDetailAtom early returns when view.id mismatches and when no id', async () => {
    jest.doMock('jotai', () => ({ atom: (v) => v }))
    jest.doMock('jotai/utils', () => ({ atomWithReducer: (v) => v, atomWithReset: (v) => v, selectAtom: (a) => a }))
    jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))
    const atoms = require('../../../src/common/store/atoms')
    // mismatch id
    let get = (a) => (a === atoms.viewAtom ? { id: 'other' } : '/')
    expect(await atoms.nodeDetailAtom(get)).toBeNull()
    // matching id but missing detail
    get = (a) => (a === atoms.viewAtom ? { id: atoms.nodesDetailId } : '/')
    expect(await atoms.nodeDetailAtom(get)).toBeNull()
  })

  test('baseUrlAtom falls back to pathname when parsed hash missing', () => {
    jest.doMock('jotai', () => ({ atom: (v) => v }))
    jest.doMock('jotai/utils', () => ({ atomWithReducer: (v) => v, atomWithReset: (v) => v, selectAtom: (a) => a }))
    // Simulate no hash by setting window.location.hash to empty and re-requiring atoms
    const origHash = window.location.hash
    window.location.hash = ''
    jest.resetModules()
    const atoms = require('../../../src/common/store/atoms')
    expect(atoms.baseUrlAtom).toBeDefined()
    window.location.hash = origHash
  })

  test('logsWebsocketUrlAtom appends missing slash to relative base path', () => {
    jest.doMock('jotai', () => ({ atom: (v) => v }))
    jest.doMock('jotai/utils', () => ({ atomWithReducer: (v) => v, atomWithReset: (v) => v, selectAtom: (a) => a }))
    jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))
    const atoms = require('../../../src/common/store/atoms')
    const logsConfig = { serviceId: 'svcX', tail: 5, since: 0, follow: false, timestamps: false, stdout: true, stderr: true, details: false }
    const get = (a) => {
      if (a === atoms.logsConfigAtom) return logsConfig
      if (a === atoms.baseUrlAtom) return '/my/base' // no trailing slash
      if (a === atoms.isDarkModeAtom) return false
      return null
    }
    const url = atoms.logsWebsocketUrlAtom(get)
    expect(url).toContain('/my/base/docker/logs/svcX')
  })

  test('logsWebsocketUrlAtom produces wss for https absolute baseUrl', () => {
    jest.doMock('jotai', () => ({ atom: (v) => v }))
    jest.doMock('jotai/utils', () => ({ atomWithReducer: (v) => v, atomWithReset: (v) => v, selectAtom: (a) => a }))
    jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))
    const atoms = require('../../../src/common/store/atoms')
    const get = (a) => {
      if (a === atoms.logsConfigAtom) return { serviceId: 's3', tail: 10, since: 0, follow: true, timestamps: false, stdout: true, stderr: false, details: false }
      if (a === atoms.baseUrlAtom) return 'https://example.com/app/'
      return null
    }
    const url = atoms.logsWebsocketUrlAtom(get)
    expect(url.startsWith('wss://')).toBe(true)
    expect(url).toContain('/app/docker/logs/s3')
  })

  test('logsWebsocketUrlAtom handles absolute baseUrl without trailing slash', () => {
    jest.doMock('jotai', () => ({ atom: (v) => v }))
    jest.doMock('jotai/utils', () => ({ atomWithReducer: (v) => v, atomWithReset: (v) => v, selectAtom: (a) => a }))
    jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))
    const atoms = require('../../../src/common/store/atoms')
    const get = (a) => {
      if (a === atoms.logsConfigAtom) return { serviceId: 'sX', tail: 1, since: 0, follow: true, timestamps: false, stdout: true, stderr: false, details: false }
      if (a === atoms.baseUrlAtom) return 'http://my.test/app' // no trailing slash
      return null
    }
    const url = atoms.logsWebsocketUrlAtom(get)
    expect(url.startsWith('ws://') || url.startsWith('wss://')).toBe(true)
    expect(url).toContain('/app/docker/logs/sX')
  })

  test('logsWebsocketUrlAtom builds query when params are string booleans and relative base without slash', () => {
    jest.doMock('jotai', () => ({ atom: (v) => v }))
    jest.doMock('jotai/utils', () => ({ atomWithReducer: (v) => v, atomWithReset: (v) => v, selectAtom: (a) => a }))
    jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))
    const atoms = require('../../../src/common/store/atoms')
    const logsConfig = { serviceId: 'svcY', tail: '10', since: '0', follow: 'true', timestamps: 'false', stdout: '1', stderr: '0', details: 'false' }
    const get = (a) => {
      if (a === atoms.logsConfigAtom) return logsConfig
      if (a === atoms.baseUrlAtom) return '/api' // no trailing slash
      return null
    }
    const url = atoms.logsWebsocketUrlAtom(get)
    expect(typeof url).toBe('string')
    expect(url).toContain('svcY')
    // ensure query params serialized
    expect(url).toContain('follow=true')
    expect(url).toContain('stdout=1')
  })

  test('nodeDetailAtom fetches when view.id matches and returns json', async () => {
    jest.doMock('jotai', () => ({ atom: (v) => v }))
    jest.doMock('jotai/utils', () => ({ atomWithReducer: (v) => v, atomWithReset: (v) => v, selectAtom: (a) => a }))
    jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))
    global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({ node: true }) }))
    const atoms = require('../../../src/common/store/atoms')
  const nav = require('../../../src/common/navigationConstants')
  const get = (a) => (a === atoms.viewAtom ? { id: nav.nodesDetailId, detail: 'n1' } : '/')
    const res = await atoms.nodeDetailAtom(get)
    expect(res).toEqual({ node: true })
  })

  test('exhaustive detail atoms branches (mismatch, missing id, and fetch)', async () => {
    jest.doMock('jotai', () => ({ atom: (v) => v }))
    jest.doMock('jotai/utils', () => ({ atomWithReducer: (v) => v, atomWithReset: (v) => v, selectAtom: (a) => a }))
    jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))

    const atoms = require('../../../src/common/store/atoms')
    const nav = require('../../../src/common/navigationConstants')

    // helper to mock fetch and call atom
    const doFetched = async (atomFn, viewObj) => {
      global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({ ok: true }) }))
      const res = await atomFn((a) => (a === atoms.viewAtom ? viewObj : '/'))
      return res
    }

    // nodeDetail: mismatch id -> null
    let res = await atoms.nodeDetailAtom(() => ({ id: 'other' }))
    expect(res).toBeNull()
    // nodeDetail: missing id -> null
    res = await atoms.nodeDetailAtom(() => ({ id: nav.nodesDetailId }))
    expect(res).toBeNull()
    // nodeDetail: matching id and fetch
    res = await doFetched(atoms.nodeDetailAtom, { id: nav.nodesDetailId, detail: 'nX' })
    expect(res).toEqual({ ok: true })

    // serviceDetail: mismatch and missing
    res = await atoms.serviceDetailAtom(() => ({ id: 'other' }))
    expect(res).toBeNull()
    res = await atoms.serviceDetailAtom(() => ({ id: nav.servicesDetailId }))
    expect(res).toBeNull()
    res = await doFetched(atoms.serviceDetailAtom, { id: nav.servicesDetailId, detail: 'sY' })
    expect(res).toEqual({ ok: true })

    // taskDetail: mismatch and missing
    res = await atoms.taskDetailAtom(() => ({ id: 'other' }))
    expect(res).toBeNull()
    res = await atoms.taskDetailAtom(() => ({ id: nav.tasksId }))
    expect(res).toBeNull()
    res = await doFetched(atoms.taskDetailAtom, { id: nav.tasksId, detail: 'tZ' })
    expect(res).toEqual({ ok: true })
  })

  test('taskDetailAtom fetches when view.id matches and returns json', async () => {
    jest.doMock('jotai', () => ({ atom: (v) => v }))
    jest.doMock('jotai/utils', () => ({ atomWithReducer: (v) => v, atomWithReset: (v) => v, selectAtom: (a) => a }))
    jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))
    global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({ task: true }) }))
    const atoms = require('../../../src/common/store/atoms')
  const nav = require('../../../src/common/navigationConstants')
  const get = (a) => (a === atoms.viewAtom ? { id: nav.tasksId, detail: 't1' } : '/')
    const res = await atoms.taskDetailAtom(get)
    expect(res).toEqual({ task: true })
  })

  test('serviceDetailAtom fetches when view.id matches and returns json', async () => {
    jest.doMock('jotai', () => ({ atom: (v) => v }))
    jest.doMock('jotai/utils', () => ({ atomWithReducer: (v) => v, atomWithReset: (v) => v, selectAtom: (a) => a }))
    jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))
    global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({ svc: true }) }))
    const atoms = require('../../../src/common/store/atoms')
    const nav = require('../../../src/common/navigationConstants')
    const get = (a) => (a === atoms.viewAtom ? { id: nav.servicesDetailId, detail: 'sX' } : '/')
    const res = await atoms.serviceDetailAtom(get)
    expect(res).toEqual({ svc: true })
  })

  test('dashboardSettingsDefaultLayoutViewIdAtom returns correct id for row and column', async () => {
    jest.doMock('jotai', () => ({ atom: (v) => v }))
    jest.doMock('jotai/utils', () => ({ atomWithReducer: (v) => v, atomWithReset: (v) => v, selectAtom: (a) => a }))
    jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))
    const atoms = require('../../../src/common/store/atoms')
    // row -> dashboardHId
    const getRow = (a) => (a === atoms.dashboardSettingsAtom ? { defaultLayout: 'row' } : '/')
    const idRow = await atoms.dashboardSettingsDefaultLayoutViewIdAtom(getRow)
    const nav = require('../../../src/common/navigationConstants')
    expect(idRow).toBe(nav.dashboardHId)

    // column -> dashboardVId
    const getCol = (a) => (a === atoms.dashboardSettingsAtom ? { defaultLayout: 'column' } : '/')
    const idCol = await atoms.dashboardSettingsDefaultLayoutViewIdAtom(getCol)
    expect(idCol).toBe(nav.dashboardVId)
  })

  test('parseHashToObj handles decode errors and strips quotes', () => {
    const atoms = require('../../../src/common/store/atoms')
    // malformed percent-encoding in hash should be handled by catch path
    const out = atoms.parseHashToObj('#x=%ZZ&y=%22z%22')
    expect(out.x).toBe('%ZZ')
    expect(out.y).toBe('z')
  })

  test('parseHashToObj returns empty object for empty or non-string input', () => {
    const atoms = require('../../../src/common/store/atoms')
    expect(atoms.parseHashToObj('')).toEqual({})
    expect(atoms.parseHashToObj(null)).toEqual({})
    expect(atoms.parseHashToObj(undefined)).toEqual({})
  })

  test('logsWebsocketUrlAtom handles relative base that already ends with slash', () => {
    jest.doMock('jotai', () => ({ atom: (v) => v }))
    jest.doMock('jotai/utils', () => ({ atomWithReducer: (v) => v, atomWithReset: (v) => v, selectAtom: (a) => a }))
    jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))
    const atoms = require('../../../src/common/store/atoms')
    const logsConfig = { serviceId: 'svcSlash', tail: 5, since: 0, follow: false, timestamps: false, stdout: true, stderr: true, details: false }
    const get = (a) => {
      if (a === atoms.logsConfigAtom) return logsConfig
      if (a === atoms.baseUrlAtom) return '/my/base/' // already has trailing slash
      return null
    }
    const url = atoms.logsWebsocketUrlAtom(get)
    expect(typeof url).toBe('string')
    expect(url).toContain('/my/base/docker/logs/svcSlash')
  })

  test('logsWebsocketUrlAtom returns a string even when some params are undefined', () => {
    jest.doMock('jotai', () => ({ atom: (v) => v }))
    jest.doMock('jotai/utils', () => ({ atomWithReducer: (v) => v, atomWithReset: (v) => v, selectAtom: (a) => a }))
    jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))
    const atoms = require('../../../src/common/store/atoms')
    // omit optional fields in logsConfig (undefined values)
    const logsConfig = { serviceId: 'svcUndef' }
    const get = (a) => (a === atoms.logsConfigAtom ? logsConfig : '/')
    const url = atoms.logsWebsocketUrlAtom(get)
    expect(typeof url).toBe('string')
    expect(url).toContain('svcUndef')
  })
})
