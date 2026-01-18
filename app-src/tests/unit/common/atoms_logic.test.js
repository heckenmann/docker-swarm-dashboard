// atoms_logic.test.js
// Tests the logsWebsocketUrlAtom getter logic for both relative and absolute base URLs.
jest.mock('jotai', () => ({ atom: (v) => v }))
jest.mock('jotai-location', () => ({ atomWithHash: (k, def) => def }))

describe('logsWebsocketUrlAtom logic', () => {
  afterEach(() => jest.resetModules())

  test('constructs ws url from relative base', () => {
    // require after mocks
    const atoms = require('../../../src/common/store/atoms')
    // logsWebsocketUrlAtom is a getter function (get) => wsUrl
    const get = (req) => {
      if (req === atoms.baseUrlAtom) return '/app/'
      if (req === atoms.logsConfigAtom) return { serviceId: 'svc', tail: 10, since: 0, follow: true, timestamps: true, stdout: true, stderr: true, details: false }
      return null
    }
    const ws = atoms.logsWebsocketUrlAtom(get)
    expect(ws).toContain('ws://')
    expect(ws).toContain('/app/docker/logs/svc')
  })

  test('constructs ws url from absolute base', () => {
    const atoms = require('../../../src/common/store/atoms')
    const get = (req) => {
      if (req === atoms.baseUrlAtom) return 'https://example.com/base/'
      if (req === atoms.logsConfigAtom) return { serviceId: 'svc2', tail: 5, since: 1, follow: false, timestamps: false, stdout: false, stderr: false, details: true }
      return null
    }
    const ws = atoms.logsWebsocketUrlAtom(get)
    // https -> wss
    expect(ws.startsWith('wss://')).toBe(true)
    expect(ws).toContain('/base/docker/logs/svc2')
  })
})
