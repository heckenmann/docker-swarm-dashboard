describe('theme atoms branch coverage', () => {
  beforeEach(() => jest.resetModules())

  test('currentVariantAtom and related atoms return correct values for dark and light', () => {
    // Mock jotai and helpers so atoms.js exports inner functions we can call
    jest.doMock('jotai', () => ({ atom: (v) => v }))
    jest.doMock('jotai/utils', () => ({
      atomWithReducer: (v) => v,
      atomWithReset: (v) => v,
      selectAtom: (a) => a,
    }))
    jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))

    const atoms = require('../../../src/common/store/atoms')

    // when isDarkModeAtom returns true
    const getDark = (a) => (a === atoms.isDarkModeAtom ? true : null)
    expect(atoms.currentVariantAtom(getDark)).toBe('dark')
    expect(atoms.currentVariantClassesAtom(getDark)).toContain('text-light')
    expect(typeof atoms.currentSyntaxHighlighterStyleAtom(getDark)).toBe(
      'object',
    )

    // when isDarkModeAtom returns false
    const getLight = (a) => (a === atoms.isDarkModeAtom ? false : null)
    expect(atoms.currentVariantAtom(getLight)).toBe('light')
    expect(atoms.currentVariantClassesAtom(getLight)).toContain('text-dark')
    expect(typeof atoms.currentSyntaxHighlighterStyleAtom(getLight)).toBe(
      'object',
    )
  })
})
