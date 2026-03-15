// atoms-derived.test.js
// Test derived atoms using real Jotai (not mocked)

// Mock only jotai-location - use real jotai for everything else
jest.mock('jotai-location', () => ({
  atomWithHash: (_key, defaultVal) => {
    const { atom } = jest.requireActual('jotai')
    return atom(defaultVal)
  },
}))

describe('derived atoms', () => {
  test('currentVariantAtom and currentVariantClassesAtom correctly derived from isDarkModeAtom', () => {
    const { createStore } = require('jotai/vanilla')
    const { isDarkModeAtom, currentVariantAtom, currentVariantClassesAtom } =
      require('../../../src/common/store/atoms')
    const store = createStore()

    store.set(isDarkModeAtom, true)
    expect(store.get(currentVariantAtom)).toBe('dark')
    expect(store.get(currentVariantClassesAtom)).toContain('bg-dark')

    store.set(isDarkModeAtom, false)
    expect(store.get(currentVariantAtom)).toBe('light')
    expect(store.get(currentVariantClassesAtom)).toContain('bg-light')
  })
})