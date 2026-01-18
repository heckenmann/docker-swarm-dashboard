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
