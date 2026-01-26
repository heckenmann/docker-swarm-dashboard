// atoms.test.js
// Smoke test: require atoms module with safe jotai mocks and verify expected exports exist.
jest.mock('jotai', () => ({
  atom: (v) => v,
  useAtom: () => [true, () => {}],
  useAtomValue: () => ({}),
}))
jest.mock('jotai/utils', () => ({ atomWithReducer: (v) => v, atomWithReset: (v) => v, selectAtom: (a) => a }))
jest.mock('jotai-location', () => ({ atomWithHash: (k, def) => def }))

describe('atoms module', () => {
  afterEach(() => jest.resetModules())

  test('can import atoms and exports exist', () => {
    // require inside test so mocks are applied
    const atoms = require('../../../src/common/store/atoms')
    // key atoms we expect
    expect(atoms.baseUrlAtom).toBeDefined()
    expect(atoms.dashboardSettingsAtom).toBeDefined()
    expect(atoms.tableSizeAtom).toBeDefined()
    expect(atoms.logsWebsocketUrlAtom).toBeDefined()
  })
})

describe('atoms hash parsing for baseUrlAtom', () => {
  afterEach(() => {
  jest.resetModules()
  // reset hash to empty string after test
  if (global.window && global.window.location) global.window.location.hash = ''
  })

  test('decodes percent-encoded base value from location.hash and strips quotes', () => {
  const hash = 'base="http%3A%2F%2Flocalhost%3A3001%2F"&other=1'
  // set jsdom window.location.hash directly
  if (!global.window) global.window = window
  global.window.location.hash = hash

    jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))
    jest.doMock('jotai', () => ({ atom: (v) => v }))
    jest.doMock('jotai/utils', () => ({ atomWithReducer: (v) => v, atomWithReset: (v) => v, selectAtom: (a) => a }))

    const atoms = require('../../../src/common/store/atoms')
    expect(atoms.baseUrlAtom).toBe('http://localhost:3001/')
  })
})
