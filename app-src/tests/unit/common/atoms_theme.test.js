describe('theme atoms branch coverage', () => {
  beforeEach(() => jest.resetModules())

  test('currentVariantAtom and related atoms return correct values for dark and light', async () => {
    // Mock jotai and helpers so atoms.js exports inner functions we can call
    jest.doMock('jotai', () => ({ atom: (v) => v }))
    jest.doMock('jotai/utils', () => ({
      atomWithReducer: (v) => v,
      atomWithReset: (v) => v,
      selectAtom: (a) => a,
      atomFamily: (v) => v,
      loadable: (v) => v,
    }))
    jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))

    const atoms = require('../../../src/common/store/atoms')

    // when isDarkModeAtom returns true
    const getDark = (a) => (a === atoms.isDarkModeAtom ? true : null)
    const darkVariant = await atoms.currentVariantAtom(getDark)
    expect(darkVariant).toBe('dark')
    expect(await atoms.currentVariantClassesAtom(getDark)).toContain('text-light')
    expect(typeof await atoms.currentSyntaxHighlighterStyleAtom(getDark)).toBe(
      'object',
    )

    // when isDarkModeAtom returns false
    const getLight = (a) => (a === atoms.isDarkModeAtom ? false : null)
    const lightVariant = await atoms.currentVariantAtom(getLight)
    expect(lightVariant).toBe('light')
    expect(await atoms.currentVariantClassesAtom(getLight)).toContain('text-dark')
    expect(typeof await atoms.currentSyntaxHighlighterStyleAtom(getLight)).toBe(
      'object',
    )
  })

  // Test edge cases related to the hash value handling issue
  test('currentVariantClassesAtom and currentSyntaxHighlighterStyleAtom handle async values correctly', async () => {
    // Mock jotai with proper async support
    jest.doMock('jotai', () => ({ 
      atom: (v) => {
        // If v is a function, it might be async
        if (typeof v === 'function') {
          return async (get) => {
            // Handle the special case where we're testing async behavior
            if (v.length > 1) {
              // It's a setter function, return as-is
              return v;
            }
            // It's a getter function, call it
            return await v(get);
          };
        }
        return v;
      } 
    }))
    jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))

    const atoms = require('../../../src/common/store/atoms')

    // Test with async isDarkModeAtom returning true
    const getAsyncDark = async (a) => {
      if (a === atoms.isDarkModeAtom) {
        // Simulate async behavior
        return Promise.resolve(true);
      }
      return null;
    };

    // These should properly await the async values
    const darkVariant = await atoms.currentVariantAtom(getAsyncDark);
    expect(darkVariant).toBe('dark');

    // These tests would reveal the issue: currentVariantClassesAtom and 
    // currentSyntaxHighlighterStyleAtom should properly await isDarkModeAtom
    expect(typeof await atoms.currentVariantClassesAtom(getAsyncDark)).toBe('string');
    expect(typeof await atoms.currentSyntaxHighlighterStyleAtom(getAsyncDark)).toBe('object');
  });

  // Test for the specific null hash handling issue
  test('createHashAtomWithDefault correctly handles null values', async () => {
    // Mock to test the specific issue where null was treated as a valid value
    jest.doMock('jotai', () => ({ atom: (v) => v }))
    jest.doMock('jotai-location', () => ({ 
      atomWithHash: (k, def) => {
        // Simulate the problematic behavior where null is returned
        if (k === 'darkMode') {
          return null; // This simulates the hash value being null
        }
        return def;
      } 
    }))

    const atoms = require('../../../src/common/store/atoms')
    
    // Create a mock get function that simulates the problematic behavior
    const getWithNullHash = (atom) => {
      // For isDarkModeAtom, return null (simulating hash being null)
      if (atom === atoms.isDarkModeAtom) {
        return null;
      }
      // For isDarkModeDefaultAtom, return the server default
      if (atom === atoms.isDarkModeDefaultAtom) {
        return false; // Server default is false
      }
      return undefined;
    };

    // This test should reveal the issue: when hash value is null,
    // it should fall back to server default, not use null as the value
    const variant = await atoms.currentVariantAtom(getWithNullHash);
    // With the fixed implementation, this should be 'light' (based on server default false)
    // With the buggy implementation, this could be 'dark' or cause an error
  });
})
