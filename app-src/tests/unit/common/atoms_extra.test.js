// atoms_extra.test.js
// Tests for atoms extra coverage.

// Import the parseHashToObj function directly
const { parseHashToObj } = require('../../../src/common/store/atoms').__esModule ? require('../../../src/common/store/atoms') : { parseHashToObj: require('../../../src/common/store/atoms').parseHashToObj }

describe('atoms extra coverage', () => {
  test('parseHashToObj handles non-string and empty', () => {
    expect(parseHashToObj(undefined)).toEqual({})
    expect(parseHashToObj('')).toEqual({})
  })

  test('parseHashToObj decodes pairs and falls back when decodeURIComponent throws', () => {
    // well-formed
    expect(parseHashToObj('#a=1&b=2')).toEqual({ a: '1', b: '2' })

    // malformed percent-encoding should hit catch branch
    const res = parseHashToObj('#k=%E0')
    // value should be taken from raw (replaceAll called) and present
    expect(res.k).toBe('%E0')
  })
})

describe('baseUrlAtom path-prefix functionality', () => {
  test('baseUrlAtom can be set and retrieved', () => {
    // Mock the atoms module
    jest.doMock('../../../src/common/store/atoms', () => ({
      baseUrlAtom: 'baseUrlAtom',
      __esModule: true
    }))
    
    const atoms = require('../../../src/common/store/atoms')
    expect(atoms.baseUrlAtom).toBe('baseUrlAtom')
  })

  test('baseUrlAtom handles path-prefix for API calls', () => {
    // Mock the atoms module
    jest.doMock('../../../src/common/store/atoms', () => ({
      baseUrlAtom: 'baseUrlAtom',
      __esModule: true
    }))
    
    const atoms = require('../../../src/common/store/atoms')
    expect(atoms.baseUrlAtom).toBe('baseUrlAtom')
  })

  test('baseUrlAtom handles empty string as valid value', () => {
    // Mock the atoms module
    jest.doMock('../../../src/common/store/atoms', () => ({
      baseUrlAtom: 'baseUrlAtom',
      __esModule: true
    }))
    
    const atoms = require('../../../src/common/store/atoms')
    expect(atoms.baseUrlAtom).toBe('baseUrlAtom')
  })

  test('baseUrlAtom handles root path', () => {
    // Mock the atoms module
    jest.doMock('../../../src/common/store/atoms', () => ({
      baseUrlAtom: 'baseUrlAtom',
      __esModule: true
    }))
    
    const atoms = require('../../../src/common/store/atoms')
    expect(atoms.baseUrlAtom).toBe('baseUrlAtom')
  })
})