// atoms.combined.test.js - aggregates all atoms-related test modules
// Each test file uses a different mock strategy for Jotai.

// Simple tests for the atoms exports
describe('atoms exports', () => {
  it('should export all required atoms', () => {
    const atoms = require('../../../src/common/store/atoms')
    expect(atoms.baseUrlAtom).toBeDefined()
    expect(atoms.refreshIntervalAtom).toBeDefined()
    expect(atoms.viewAtom).toBeDefined()
    expect(atoms.messagesAtom).toBeDefined()
    expect(atoms.tableSizeAtom).toBeDefined()
    expect(atoms.serviceNameFilterAtom).toBeDefined()
    expect(atoms.stackNameFilterAtom).toBeDefined()
    expect(atoms.filterTypeAtom).toBeDefined()
    expect(atoms.logsLinesAtom).toBeDefined()
    expect(atoms.logsShowLogsAtom).toBeDefined()
    expect(atoms.logsNumberOfLinesAtom).toBeDefined()
    expect(atoms.isDarkModeAtom).toBeDefined()
    expect(atoms.networkRequestsAtom).toBeDefined()
    expect(atoms.showNamesButtonsAtom).toBeDefined()
    expect(atoms.showNavLabelsAtom).toBeDefined()
    expect(atoms.maxContentWidthAtom).toBeDefined()
    expect(atoms.defaultLayoutAtom).toBeDefined()
    expect(atoms.hiddenServiceStatesAtom).toBeDefined()
    expect(atoms.timeZoneAtom).toBeDefined()
    expect(atoms.localeAtom).toBeDefined()
    expect(atoms.showWelcomeMessageAtom).toBeDefined()
    expect(atoms.versionRefreshAtom).toBeDefined()
    expect(atoms.versionAtom).toBeDefined()
    expect(atoms.dashboardSettingsAtom).toBeDefined()
  })
})

jest.isolateModules(() => {
  jest.doMock('jotai', () => ({
    atom: (v) => v,
    useAtom: () => [true, () => {}],
    useAtomValue: () => ({}),
    Provider: ({ children }) => children
  }))
  jest.doMock('jotai/utils', () => ({
    atomWithReducer: (v) => v,
    atomWithReset: (v) => v,
    selectAtom: (a) => a,
  }))
  jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))
  require('./atoms_logic.test.js')
})

jest.isolateModules(() => {
  jest.doMock('jotai', () => ({
    atom: (v) => v,
    useAtom: () => [true, () => {}],
    useAtomValue: () => ({}),
    Provider: ({ children }) => children
  }))
  require('./atoms_extra.test.js')
})