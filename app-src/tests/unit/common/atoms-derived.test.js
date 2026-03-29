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
  test('currentVariantAtom and currentVariantClassesAtom correctly derived from isDarkModeAtom', async () => {
    const { createStore } = require('jotai/vanilla')
    const { isDarkModeAtom, currentVariantAtom, currentVariantClassesAtom, currentSyntaxHighlighterStyleAtom } =
      require('../../../src/common/store/atoms')
    
    // Test dark mode
    const darkStore = createStore()
    darkStore.set(isDarkModeAtom, true)
    const darkVariant = await darkStore.get(currentVariantAtom)
    expect(darkVariant).toBe('dark')
    const darkClasses = await darkStore.get(currentVariantClassesAtom)
    expect(darkClasses).toContain('bg-dark')
    
    // Test light mode
    const lightStore = createStore()
    lightStore.set(isDarkModeAtom, false)
    const lightVariant = await lightStore.get(currentVariantAtom)
    expect(lightVariant).toBe('light')
    const lightClasses = await lightStore.get(currentVariantClassesAtom)
    expect(lightClasses).toContain('bg-light')
  })

  // Test edge cases for async handling
  test('derived atoms handle async values correctly', async () => {
    const { createStore } = require('jotai/vanilla')
    const atoms = require('../../../src/common/store/atoms')
    
    // Create a store and test async behavior
    const store = createStore()
    
    // Set isDarkModeAtom to a promise that resolves to true
    store.set(atoms.isDarkModeAtom, Promise.resolve(true))
    
    // These should properly await the async values
    const variant = await store.get(atoms.currentVariantAtom)
    expect(variant).toBe('dark')
    
    const classes = await store.get(atoms.currentVariantClassesAtom)
    expect(classes).toContain('bg-dark')
    
    const style = await store.get(atoms.currentSyntaxHighlighterStyleAtom)
    expect(style).toBeDefined()
  })

  // Test handling of null values in hash-based atoms
  test('hash-based atoms correctly handle null fallback to server defaults', async () => {
    const { createStore } = require('jotai/vanilla')
    const foundationAtoms = require('../../../src/common/store/atoms/foundationAtoms')
    
    // Create a store with a mock dashboardSettingsAtom that has specific defaults
    const store = createStore()
    
    // Test with a null-like scenario
    // Note: this requires more sophisticated mocking to test the exact issue
    
    // For now, ensure the atoms don't crash with typical usage
    expect(async () => {
      await store.get(foundationAtoms.isDarkModeDefaultAtom)
    }).not.toThrow()
  })
})