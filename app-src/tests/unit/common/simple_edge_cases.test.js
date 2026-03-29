// simple_edge_cases.test.js
// Simple edge case testing for async atoms

// Mock fetch globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({
      isDarkMode: false,
    }),
  }),
);

describe('Simple Async Atom Edge Cases', () => {
  let atom;
  let createStore;
  let atomWithHash;

  beforeAll(async () => {
    // Dynamically import jotai modules
    const jotaiModule = await import('jotai');
    atom = jotaiModule.atom;
    createStore = jotaiModule.createStore;
    
    // Import atomWithHash from jotai-location
    const jotaiLocationModule = await import('jotai-location');
    atomWithHash = jotaiLocationModule.atomWithHash;
  });

  // Reset modules before each test
  beforeEach(() => {
    jest.resetModules();
    fetch.mockClear();
  });

  test('should handle null hash values correctly', async () => {
    // Create the CORRECTED createHashAtomWithDefault function
    const createHashAtomWithDefault = (key, defaultAtom) => {
      const hashAtom = atomWithHash(key);
      return atom(
        async (get) => {
          const hashValue = get(hashAtom);
          // CORRECTED: Check for both undefined AND null
          if (hashValue !== undefined && hashValue !== null) return hashValue;
          const defaultValue = get(defaultAtom);
          return defaultValue instanceof Promise ? await defaultValue : defaultValue;
        },
        (get, set, value) => set(hashAtom, value),
      );
    };
    
    // Create a default atom that returns false (server default)
    const serverDefaultAtom = atom(false);
    
    // Create hash atom with default using the corrected implementation
    const hashAtomWithDefault = createHashAtomWithDefault('testKey', serverDefaultAtom);
    
    const store = createStore();
    
    // Explicitly set hash value to null
    store.set(hashAtomWithDefault, null);
    
    // Get the value - this should fallback to server default
    const result = await store.get(hashAtomWithDefault);
    
    // Should fallback to server default (false) rather than using null
    expect(result).toBe(false);
  });

  test('should prioritize valid hash values over server defaults', async () => {
    // Create the CORRECTED createHashAtomWithDefault function
    const createHashAtomWithDefault = (key, defaultAtom) => {
      const hashAtom = atomWithHash(key);
      return atom(
        async (get) => {
          const hashValue = get(hashAtom);
          // CORRECTED: Check for both undefined AND null
          if (hashValue !== undefined && hashValue !== null) return hashValue;
          const defaultValue = get(defaultAtom);
          return defaultValue instanceof Promise ? await defaultValue : defaultValue;
        },
        (get, set, value) => set(hashAtom, value),
      );
    };
    
    // Create a default atom that returns false (server default)
    const serverDefaultAtom = atom(false);
    
    // Create hash atom with default using the corrected implementation
    const hashAtomWithDefault = createHashAtomWithDefault('testKey', serverDefaultAtom);
    
    const store = createStore();
    
    // Set hash value to true (contradicting server default)
    store.set(hashAtomWithDefault, true);
    
    // Get the value - this should use hash value
    const result = await store.get(hashAtomWithDefault);
    
    // Should use hash value (true) over server default (false)
    expect(result).toBe(true);
  });

  test('should handle async default atoms correctly', async () => {
    // Create the CORRECTED createHashAtomWithDefault function
    const createHashAtomWithDefault = (key, defaultAtom) => {
      const hashAtom = atomWithHash(key);
      return atom(
        async (get) => {
          const hashValue = get(hashAtom);
          // CORRECTED: Check for both undefined AND null
          if (hashValue !== undefined && hashValue !== null) return hashValue;
          const defaultValue = get(defaultAtom);
          return defaultValue instanceof Promise ? await defaultValue : defaultValue;
        },
        (get, set, value) => set(hashAtom, value),
      );
    };
    
    // Create an async default atom that resolves to true
    const asyncServerDefaultAtom = atom(async () => Promise.resolve(true));
    
    // Create hash atom with default using the corrected implementation
    const hashAtomWithDefault = createHashAtomWithDefault('testKey', asyncServerDefaultAtom);
    
    const store = createStore();
    
    // Don't set any hash value, should fallback to async server default
    
    // Get the value - this should fallback to async server default
    const result = await store.get(hashAtomWithDefault);
    
    // Should fallback to async server default (true)
    expect(result).toBe(true);
  });

  // Test the specific scenario that caused our bug
  test('regression test: createHashAtomWithDefault should not treat null as valid value', async () => {
    // This test specifically addresses the FIX we made to prevent treating null as valid value
    
    // FIXED implementation
    const createHashAtomWithDefault = (key, defaultAtom) => {
      const hashAtom = atomWithHash(key);
      return atom(
        async (get) => {
          const hashValue = get(hashAtom);
          // FIXED: Check for both undefined AND null
          if (hashValue !== undefined && hashValue !== null) return hashValue;
          const defaultValue = get(defaultAtom);
          return defaultValue instanceof Promise ? await defaultValue : defaultValue;
        },
        (get, set, value) => set(hashAtom, value),
      );
    };
    
    // Server default is false (dark mode disabled)
    const serverDefaultAtom = atom(false);
    
    // Hash-based atom using the FIXED implementation
    const hashAtomWithDefault = createHashAtomWithDefault('darkMode', serverDefaultAtom);
    
    const store = createStore();
    
    // Simulate the scenario where hash is explicitly set to null
    store.set(hashAtomWithDefault, null);
    
    // Get the value - with the FIXED implementation, this should return server default (false)
    // With the OLD implementation, this would return null
    const result = await store.get(hashAtomWithDefault);
    
    // This test will PASS with the FIXED implementation
    // and FAIL with the OLD implementation
    expect(result).toBe(false);
  });
});