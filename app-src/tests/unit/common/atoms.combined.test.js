// atoms.combined.test.js - aggregates all atoms-related test modules
// Each test file uses a different mock strategy for Jotai. We use jest.isolateModules()
// with jest.doMock() (not jest.mock()) to set up mocks at runtime within each isolated scope.
// jest.doMock() is NOT hoisted, so it works correctly within jest.isolateModules().

jest.isolateModules(() => {
  // Set up mocks at runtime before requiring the test file
  jest.doMock('jotai', () => ({
    atom: (v) => v,
    useAtom: () => [true, () => {}],
    useAtomValue: () => ({}),
  }))
  jest.doMock('jotai/utils', () => ({
    atomWithReducer: (v) => v,
    atomWithReset: (v) => v,
    selectAtom: (a) => a,
  }))
  jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))
  require('./atoms_parseHash.coverage.test.js')
})

jest.isolateModules(() => {
  jest.doMock('jotai', () => ({
    atom: (v) => v,
    useAtom: () => [true, () => {}],
    useAtomValue: () => ({}),
  }))
  jest.doMock('jotai/utils', () => ({
    atomWithReducer: (v) => v,
    atomWithReset: (v) => v,
    selectAtom: (a) => a,
  }))
  jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))
  require('./atoms.test.js')
})

jest.isolateModules(() => {
  jest.doMock('jotai', () => ({
    atom: (v) => v,
    useAtom: () => [true, () => {}],
    useAtomValue: () => ({}),
  }))
  jest.doMock('jotai/utils', () => ({
    atomWithReducer: (v) => v,
    atomWithReset: (v) => v,
    selectAtom: (a) => a,
  }))
  jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))
  require('./atoms_theme.test.js')
})

jest.isolateModules(() => {
  jest.doMock('jotai', () => ({
    atom: (v) => v,
    useAtom: () => [true, () => {}],
    useAtomValue: () => ({}),
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
  }))
  jest.doMock('jotai/utils', () => ({
    atomWithReducer: (v) => v,
    atomWithReset: (v) => v,
    selectAtom: (a) => a,
  }))
  jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))
  require('./atoms_branches.test.js')
})

jest.isolateModules(() => {
  jest.doMock('jotai', () => ({
    atom: (v) => v,
    useAtom: () => [true, () => {}],
    useAtomValue: () => ({}),
  }))
  jest.doMock('jotai/utils', () => ({
    atomWithReducer: (v) => v,
    atomWithReset: (v) => v,
    selectAtom: (a) => a,
  }))
  jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))
  require('./exercise_atoms_branches.test.js')
})

jest.isolateModules(() => {
  jest.doMock('jotai', () => ({
    atom: (v) => v,
    useAtom: () => [true, () => {}],
    useAtomValue: () => ({}),
  }))
  jest.doMock('jotai/utils', () => ({
    atomWithReducer: (v) => v,
    atomWithReset: (v) => v,
    selectAtom: (a) => a,
  }))
  jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))
  require('./fetch_atoms.combined.test.js')
})

jest.isolateModules(() => {
  jest.doMock('jotai', () => ({
    atom: (v) => v,
    useAtom: () => [true, () => {}],
    useAtomValue: () => ({}),
  }))
  jest.doMock('jotai/utils', () => ({
    atomWithReducer: (v) => v,
    atomWithReset: (v) => v,
    selectAtom: (a) => a,
  }))
  jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))
  require('./atoms_extra.test.js')
})
