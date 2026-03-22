jest.mock('jotai', () => ({ atom: (v) => v }))
jest.mock('jotai-location', () => ({
  atomWithHash: (key, defaultValue) => {
    if (typeof defaultValue === 'function') { return defaultValue }
    return defaultValue
  },
}))

// atoms.test.js
// Smoke test: require atoms module with safe jotai mocks and verify expected exports exist.
// NOTE: When run via atoms.combined.test.js aggregator, mocks are provided via jest.doMock().
// This prevents module registry contamination when tests run together via aggregator files.

describe('atoms module', () => {
  afterEach(() => {
    jest.resetModules()
  })

  test('can import atoms and exports exist', () => {
    // require inside test so mocks are applied
    const atoms = require('../../../src/common/store/atoms')
    // key atoms we expect
    expect(atoms.baseUrlAtom).toBeDefined()
    expect(atoms.dashboardSettingsAtom).toBeDefined()
    expect(atoms.tableSizeAtom).toBeDefined()
    expect(atoms.logsWebsocketUrlAtom).toBeDefined()
  })

  test('baseUrlAtom default uses parsed hash when present', () => {
    // Test parseHashToObj directly - this is what baseUrlAtom uses at module load
    const { parseHashToObj } = require('../../../src/common/store/atoms')
    const hash = '#base="http%3A%2F%2Fexample.test%2Fapi%2F"'
    const parsed = parseHashToObj(hash)
    expect(parsed.base).toBe('http://example.test/api/')
    // The baseUrlAtom implementation uses parsedHash.base || window.location.pathname
    // This test verifies parseHashToObj correctly extracts and decodes the base value
  })

  test('parseHashToObj handles multiple pairs and quoted values', () => {
    const parse = require('../../../src/common/store/atoms').parseHashToObj
    const h = '#a=1&b="two"&c=%7Bjson%7D'
    const out = parse(h)
    expect(out.a).toBe('1')
    expect(out.b).toBe('two')
    expect(out.c).toContain('{json}')
  })

  test('module-load parsedHash handles malformed decode gracefully', () => {
    const origHash = window.location.hash
    window.location.hash = '#x=%'
    jest.resetModules()
    // require module which runs parseHashToObj at module load
    const atoms = require('../../../src/common/store/atoms')
    expect(atoms.baseUrlAtom).toBeDefined()
    window.location.hash = origHash
  })

})

describe('atoms hash parsing for baseUrlAtom', () => {
  afterEach(() => {
    jest.resetModules()
    // reset hash to empty string after test
    if (global.window && global.window.location)
      global.window.location.hash = ''
  })

  test('decodes percent-encoded base value from location.hash and strips quotes', () => {
    const hash = 'base="http%3A%2F%2Flocalhost%3A3001%2F"&other=1'
    // set jsdom window.location.hash directly
    if (!global.window) global.window = window
    global.window.location.hash = hash

    // NOTE: jest.mock() calls must be at top level (not inside test functions).
    // The top-level mocks at the top of this file are already hoisted and applied.
    // Using jest.resetModules() + require() below re-imports with those hoisted mocks.

    const atoms = require('../../../src/common/store/atoms')
    expect(atoms.baseUrlAtom).toBe('http://localhost:3001/')
  })
})
