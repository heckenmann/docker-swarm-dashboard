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
